import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();

const toIsoOrNull = (value?: number | null) => {
  if (!value || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is missing");
      return new Response("Webhook Error: server is not configured", { status: 500 });
    }

    if (!signature) {
      console.error("[stripe-webhook] Missing stripe-signature header");
      return new Response("Webhook Error: missing signature", { status: 400 });
    }

    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err: any) {
    console.error("[stripe-webhook] Signature verification failed:", err?.message || err);
    return new Response(`Webhook Error: ${err?.message || "Invalid signature"}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  console.log("[stripe-webhook] Event:", event.type);

  // === One-time payment completed ===
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    // Handle subscription checkout completion — create subscription record
    if (session.mode === "subscription" && session.subscription) {
      const meta = session.metadata || {};
      const subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
      const customerId = typeof session.customer === "string"
        ? session.customer
        : session.customer?.id || "";

      // Retrieve subscription from Stripe to get current_period_end
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = toIsoOrNull(stripeSubscription.current_period_end);
      const subInterval = stripeSubscription.items.data[0]?.price?.recurring?.interval || "month";
      const latestInvoiceId = typeof stripeSubscription.latest_invoice === "string"
        ? stripeSubscription.latest_invoice
        : stripeSubscription.latest_invoice?.id || null;

      await supabase.from("subscriptions").upsert({
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        campaign_id: meta.campaign_id,
        donor_id: meta.donor_id || null,
        donor_email: session.customer_details?.email || "",
        amount: Number(meta.amount) || 0,
        interval: subInterval,
        status: "active",
        current_period_end: periodEnd,
      }, { onConflict: "stripe_subscription_id" });

      console.log("[stripe-webhook] Subscription record created:", subscriptionId);

      // Create donation record for the first subscription payment
      const firstAmount = Number(meta.amount) || (session.amount_total ? session.amount_total / 100 : 0);
      if (firstAmount > 0) {
        const paymentReference = latestInvoiceId || `subscription:${subscriptionId}:initial`;
        const { data: firstDonation } = await supabase
          .from("donations")
          .upsert({
            campaign_id: meta.campaign_id,
            amount: firstAmount,
            donor_id: meta.donor_id || null,
            donor_name: session.customer_details?.name || null,
            is_anonymous: false,
            status: "completed",
            stripe_payment_id: paymentReference,
          })
          .select("id, campaign_id, amount")
          .single();

        if (firstDonation) {
          await updateCampaignAmount(supabase, firstDonation.campaign_id);
          console.log("[stripe-webhook] First subscription donation recorded:", firstDonation.id);
        }
      } else if (meta.campaign_id) {
        await updateCampaignAmount(supabase, meta.campaign_id);
      }
    }

    // Handle one-time payment
    if (session.payment_status === "paid" && session.mode === "payment") {
      const stripePaymentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

      const { data: updatedDonation, error: donationUpdateError } = await supabase
        .from("donations")
        .update({ status: "completed", stripe_payment_id: stripePaymentId })
        .eq("stripe_session_id", session.id)
        .eq("status", "pending")
        .select("id, campaign_id, amount")
        .maybeSingle();

      if (donationUpdateError) {
        console.error("[stripe-webhook] Donation update error:", donationUpdateError.message);
      }

      if (!updatedDonation) {
        console.log("[stripe-webhook] No pending donation found for session:", session.id);
        return new Response(JSON.stringify({ received: true }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

      await updateCampaignAmount(supabase, updatedDonation.campaign_id);
      await sendConfirmationEmail(supabase, session, updatedDonation);
    }
  }

  // === Recurring invoice paid (subscription renewal) ===
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    
    // Skip the first invoice (handled by checkout.session.completed)
    if (invoice.billing_reason === "subscription_create") {
      console.log("[stripe-webhook] Skipping first subscription invoice");
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptionId = typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;

    if (subscriptionId && invoice.amount_paid > 0) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

      await supabase
        .from("subscriptions")
        .update({
          status: stripeSubscription.cancel_at_period_end ? "cancelling" : stripeSubscription.status,
          current_period_end: toIsoOrNull(stripeSubscription.current_period_end),
        })
        .eq("stripe_subscription_id", subscriptionId);

      // Find the subscription record
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("campaign_id, donor_id, donor_email, amount")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (sub) {
        const amount = invoice.amount_paid / 100;
        const paymentReference = typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : invoice.id;

        // Create a donation record for this recurring payment
        const { data: donation } = await supabase
          .from("donations")
          .upsert({
            campaign_id: sub.campaign_id,
            amount,
            donor_id: sub.donor_id,
            donor_name: null,
            is_anonymous: false,
            status: "completed",
            stripe_payment_id: paymentReference,
          }, { onConflict: "stripe_payment_id" })
          .select("id, campaign_id, amount")
          .single();

        if (donation) {
          await updateCampaignAmount(supabase, donation.campaign_id);
          console.log("[stripe-webhook] Recurring donation recorded:", donation.id);
        }
      }
    }
  }

  // === Subscription cancelled ===
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id);
    console.log("[stripe-webhook] Subscription cancelled:", subscription.id);
  }

  // === Subscription updated (e.g. cancel_at_period_end) ===
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const updates: Record<string, any> = {
      status: subscription.cancel_at_period_end ? "cancelling" : subscription.status,
      current_period_end: toIsoOrNull(subscription.current_period_end),
    };
    if (subscription.canceled_at) {
      updates.cancelled_at = toIsoOrNull(subscription.canceled_at);
    }
    await supabase
      .from("subscriptions")
      .update(updates)
      .eq("stripe_subscription_id", subscription.id);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

// Helper: update campaign current_amount
async function updateCampaignAmount(supabase: any, campaignId: string) {
  const { data: donations } = await supabase
    .from("donations")
    .select("amount")
    .eq("campaign_id", campaignId)
    .eq("status", "completed");

  const newTotal = (donations || []).reduce((sum: number, donation: { amount: number }) => sum + Number(donation.amount), 0);

  await supabase
    .from("campaigns")
    .update({ current_amount: newTotal })
    .eq("id", campaignId);

  console.log("[stripe-webhook] Campaign amount updated:", {
    campaignId,
    newTotal,
  });
}

// Helper: send donation confirmation email
async function sendConfirmationEmail(supabase: any, session: any, donation: { id: string; campaign_id: string; amount: number }) {
  const customerEmail = session.customer_details?.email;
  if (!customerEmail) return;

  const donationDate = new Date().toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const { data: campData } = await supabase
    .from("campaigns")
    .select("title")
    .eq("id", donation.campaign_id)
    .single();

  const { error: emailError } = await supabase.functions.invoke(
    "send-transactional-email",
    {
      body: {
        templateName: "donation-confirmation",
        recipientEmail: customerEmail,
        idempotencyKey: `donation-confirm-${donation.id}`,
        templateData: {
          amount: String(donation.amount),
          campaignTitle: campData?.title || "Кампания",
          donationId: donation.id,
          date: donationDate,
        },
      },
    }
  );

  if (emailError) {
    console.error("[stripe-webhook] Email send error:", emailError.message);
  } else {
    console.log("[stripe-webhook] Donation confirmation email queued for", customerEmail);
  }
}

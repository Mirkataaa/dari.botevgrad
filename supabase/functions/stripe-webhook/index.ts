import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();

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

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      const stripePaymentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

      // Update pending donation only once (idempotent for webhook retries)
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

      // If no row was updated, it was already processed or session wasn't found
      if (!updatedDonation) {
        console.log("[stripe-webhook] No pending donation found for session:", session.id);
        return new Response(JSON.stringify({ received: true }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

      const { data: campaign } = await supabase
        .from("campaigns")
        .select("current_amount")
        .eq("id", updatedDonation.campaign_id)
        .single();

      if (campaign) {
        const nextAmount = Number(campaign.current_amount) + Number(updatedDonation.amount);
        await supabase
          .from("campaigns")
          .update({ current_amount: nextAmount })
          .eq("id", updatedDonation.campaign_id);

        console.log("[stripe-webhook] Donation completed:", {
          donationId: updatedDonation.id,
          campaignId: updatedDonation.campaign_id,
          amount: updatedDonation.amount,
          sessionId: session.id,
        });
      }

      // Send donation confirmation email if donor has an email
      const customerEmail =
        typeof session.customer_details?.email === "string"
          ? session.customer_details.email
          : null;

      if (customerEmail) {
        const donationDate = new Date().toLocaleDateString("bg-BG", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // Fetch campaign title
        const { data: campData } = await supabase
          .from("campaigns")
          .select("title")
          .eq("id", updatedDonation.campaign_id)
          .single();

        const { error: emailError } = await supabase.functions.invoke(
          "send-transactional-email",
          {
            body: {
              templateName: "donation-confirmation",
              recipientEmail: customerEmail,
              idempotencyKey: `donation-confirm-${updatedDonation.id}`,
              templateData: {
                amount: String(updatedDonation.amount),
                campaignTitle: campData?.title || "Кампания",
                donationId: updatedDonation.id,
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
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (endpointSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid" && session.metadata?.campaign_id) {
      const campaignId = session.metadata.campaign_id;
      const amount = Number(session.metadata.amount);

      // Update donation status
      await supabase
        .from("donations")
        .update({ status: "completed", stripe_payment_id: session.payment_intent as string })
        .eq("stripe_session_id", session.id);

      // Update campaign current_amount
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("current_amount")
        .eq("id", campaignId)
        .single();

      if (campaign) {
        await supabase
          .from("campaigns")
          .update({ current_amount: Number(campaign.current_amount) + amount })
          .eq("id", campaignId);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

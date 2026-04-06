import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { campaignId, amount, interval = "month" } = await req.json();
    console.log("[create-subscription] Request:", { campaignId, amount, interval });

    if (!campaignId || !amount || amount < 1) {
      throw new Error("Invalid campaign or amount");
    }

    if (!["month", "year"].includes(interval)) {
      throw new Error("Invalid interval. Use 'month' or 'year'");
    }

    // User must be authenticated for subscriptions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Трябва да сте влезли в профила си за абонамент");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user?.email) throw new Error("Трябва да сте влезли в профила си за абонамент");

    // Verify campaign is recurring and active
    const { data: campaign, error: campErr } = await serviceClient
      .from("campaigns")
      .select("title, status, campaign_type")
      .eq("id", campaignId)
      .single();

    if (campErr || !campaign) throw new Error("Campaign not found");
    if (campaign.status !== "active") throw new Error("Campaign is not active");
    if ((campaign as any).campaign_type !== "recurring") throw new Error("Campaign does not support subscriptions");

    const { data: existingSubscription } = await serviceClient
      .from("subscriptions")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("donor_id", user.id)
      .in("status", ["active", "cancelling"])
      .maybeSingle();

    if (existingSubscription) {
      throw new Error("Вече имате активен абонамент за тази кампания");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    let customerId: string;
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const amountInCents = Math.round(amount * 100);
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/+$/, "") || "https://dari.botevgrad.bg";

    // Create a subscription checkout session with inline price
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Месечна подкрепа: ${campaign.title}`,
            },
            unit_amount: amountInCents,
            recurring: { interval: interval as "month" | "year" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: {
        campaign_id: campaignId,
        donor_id: user.id,
        amount: String(amount),
        type: "recurring",
      },
      subscription_data: {
        metadata: {
          campaign_id: campaignId,
          donor_id: user.id,
          amount: String(amount),
        },
      },
      success_url: `${origin}/payment-success?campaign=${campaignId}&type=subscription`,
      cancel_url: `${origin}/campaign/${campaignId}?payment=cancelled`,
    });

    console.log("[create-subscription] Session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[create-subscription] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

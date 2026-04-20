// Auto-translates campaign text fields BG -> EN using Lovable AI Gateway (Gemini).
// Public function: callable by any authenticated user creating/editing a campaign.

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TranslateBody {
  title?: string;
  short_description?: string;
  description?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TranslateBody = await req.json();

    const fields: { key: keyof TranslateBody; value: string }[] = [];
    for (const k of ["title", "short_description", "description"] as const) {
      const v = body[k];
      if (typeof v === "string" && v.trim().length > 0) {
        fields.push({ key: k, value: v });
      }
    }

    if (fields.length === 0) {
      return new Response(JSON.stringify({}), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt =
      `Translate the following Bulgarian campaign fields to natural, fluent English. ` +
      `Preserve meaning, tone and any line breaks. Do NOT add commentary. ` +
      `Return ONLY valid JSON with the same keys.\n\n` +
      JSON.stringify(
        Object.fromEntries(fields.map((f) => [f.key, f.value])),
        null,
        2,
      );

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a professional Bulgarian-to-English translator for a charitable donation platform. Always respond with valid JSON only — no markdown fences, no commentary.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limited" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "ai_error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    let content: string = aiJson?.choices?.[0]?.message?.content || "{}";
    // Strip possible markdown fences
    content = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI JSON:", content);
      return new Response(
        JSON.stringify({ error: "parse_error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result: Record<string, string> = {};
    for (const f of fields) {
      const v = parsed[f.key];
      if (typeof v === "string" && v.trim().length > 0) {
        result[`${f.key}_en`] = v.trim();
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("translate-campaign error", err);
    return new Response(
      JSON.stringify({ error: "server_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// Edge function that returns OG-tagged HTML for social-media crawlers,
// and redirects regular browsers to the SPA campaign page.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Match common social-media / link-preview crawlers.
const CRAWLER_REGEX =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|WhatsApp|Discordbot|Pinterest|redditbot|Embedly|vkShare|W3C_Validator|SkypeUriPreview|Applebot|Googlebot|bingbot|Instagram|Iframely|Snapchat|preview/i;

function escapeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  amount?: number;
  target?: number;
  deadline?: string | null;
}) {
  const { title, description, image, url, amount, target, deadline } = opts;
  const progressLine =
    target && target > 0
      ? `Събрани ${amount ?? 0} € от ${target} €`
      : `Събрани ${amount ?? 0} €`;
  const deadlineLine = deadline
    ? ` · Краен срок: ${new Date(deadline).toLocaleDateString("bg-BG")}`
    : "";
  const richDesc = `${description} — ${progressLine}${deadlineLine}`;

  return `<!doctype html>
<html lang="bg" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(richDesc)}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Заедно за Ботевград" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(richDesc)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${escapeHtml(title)}" />
<meta property="og:locale" content="bg_BG" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(richDesc)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />

<link rel="canonical" href="${escapeHtml(url)}" />
<meta http-equiv="refresh" content="0;url=${escapeHtml(url)}" />
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(richDesc)}</p>
<p><a href="${escapeHtml(url)}">Виж кампанията</a></p>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    // Path is /og-preview/<campaignId> OR /og-preview?id=<campaignId>
    const segments = url.pathname.split("/").filter(Boolean);
    const idFromPath = segments[segments.length - 1];
    const campaignId =
      url.searchParams.get("id") ||
      (idFromPath && idFromPath !== "og-preview" ? idFromPath : "");

    const origin =
      url.searchParams.get("origin") ||
      req.headers.get("x-forwarded-host") ||
      "dari-botevgrad.lovable.app";
    const siteOrigin = origin.startsWith("http") ? origin : `https://${origin}`;
    const spaUrl = campaignId ? `${siteOrigin}/campaign/${campaignId}` : siteOrigin;

    const ua = req.headers.get("user-agent") || "";
    const isCrawler = CRAWLER_REGEX.test(ua);

    // Non-crawlers: 302 redirect straight into the SPA so users land on the real page.
    if (!isCrawler || !campaignId) {
      return new Response(null, {
        status: 302,
        headers: { Location: spaUrl, "Cache-Control": "no-store" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: campaign } = await supabase
      .from("campaigns")
      .select(
        "id, title, short_description, description, images, main_image_index, current_amount, target_amount, deadline"
      )
      .eq("id", campaignId)
      .maybeSingle();

    if (!campaign) {
      return new Response(
        buildHtml({
          title: "Заедно за Ботевград",
          description: "Дарителска платформа на Община Ботевград.",
          image: `${siteOrigin}/placeholder.svg`,
          url: spaUrl,
        }),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const mainIdx = campaign.main_image_index ?? 0;
    const image =
      (campaign.images && (campaign.images[mainIdx] || campaign.images[0])) ||
      `${siteOrigin}/placeholder.svg`;
    const description =
      campaign.short_description ||
      (campaign.description || "").slice(0, 200) ||
      "Подкрепете тази кауза в Ботевград.";

    const html = buildHtml({
      title: campaign.title,
      description,
      image,
      url: spaUrl,
      amount: Number(campaign.current_amount || 0),
      target: Number(campaign.target_amount || 0),
      deadline: campaign.deadline,
    });

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    console.error("og-preview error", e);
    return new Response("Server error", { status: 500 });
  }
});

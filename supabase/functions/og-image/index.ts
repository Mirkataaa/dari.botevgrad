// Edge function that generates a 1200x630 OG image for a campaign,
// fitting the original campaign image (object-cover) on a neutral background.
// This guarantees Facebook/LinkedIn/Messenger render a large preview card,
// regardless of the original image's aspect ratio.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
  Gravity,
} from "https://esm.sh/@imagemagick/magick-wasm@0.0.30";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TARGET_W = 1200;
const TARGET_H = 630;

let magickReady: Promise<void> | null = null;
async function ensureMagick() {
  if (!magickReady) {
    magickReady = (async () => {
      const wasmRes = await fetch(
        "https://esm.sh/@imagemagick/magick-wasm@0.0.30/dist/magick.wasm"
      );
      const wasmBytes = new Uint8Array(await wasmRes.arrayBuffer());
      await initializeImageMagick(wasmBytes);
    })();
  }
  return magickReady;
}

function placeholderPng(): Uint8Array {
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}

async function fetchSourceImage(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function buildOgImage(srcBytes: Uint8Array): Promise<Uint8Array> {
  await ensureMagick();
  return await new Promise<Uint8Array>((resolve, reject) => {
    try {
      ImageMagick.read(srcBytes, (img) => {
        // object-cover: resize so image fills 1200x630, then center-crop.
        const geom = new MagickGeometry(TARGET_W, TARGET_H);
        geom.fillArea = true;
        img.resize(geom);
        img.crop(new MagickGeometry(TARGET_W, TARGET_H), Gravity.Center);
        img.write(MagickFormat.Jpeg, (out) => resolve(new Uint8Array(out)));
      });
    } catch (e) {
      reject(e);
    }
  });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const idFromPath = segments[segments.length - 1];
    const campaignId =
      url.searchParams.get("id") ||
      (idFromPath && idFromPath !== "og-image" ? idFromPath : "");

    if (!campaignId) return new Response("Missing campaign id", { status: 400 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, images, main_image_index")
      .eq("id", campaignId)
      .maybeSingle();

    const mainIdx = (campaign as any)?.main_image_index ?? 0;
    const sourceUrl =
      (campaign?.images && (campaign.images[mainIdx] || campaign.images[0])) ||
      null;

    if (!sourceUrl) {
      return new Response(placeholderPng() as BodyInit, {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" },
      });
    }

    const srcBytes = await fetchSourceImage(sourceUrl);
    if (!srcBytes) {
      return new Response(placeholderPng() as BodyInit, {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" },
      });
    }

    const outBytes = await buildOgImage(srcBytes);

    return new Response(outBytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  } catch (e) {
    console.error("og-image error", e);
    return new Response("Server error", { status: 500 });
  }
});

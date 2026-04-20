import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check, Facebook, Instagram, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  campaignId: string;
  campaignTitle: string;
  campaignImage?: string;
  size?: "sm" | "default";
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;

const ShareWidget = ({ campaignId, campaignTitle, campaignImage, size = "default" }: Props) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);

  // Public site URL (where humans land)
  const siteUrl = `${window.location.origin}/campaign/${campaignId}`;
  // Crawler-facing URL: edge function returns OG-tagged HTML for FB scraper
  // and 302-redirects normal users back to siteUrl. Use this URL when posting
  // to social networks so previews always work.
  const shareUrl = PROJECT_ID
    ? `https://${PROJECT_ID}.supabase.co/functions/v1/og-preview/${campaignId}?origin=${encodeURIComponent(window.location.origin)}`
    : siteUrl;
  const encodedShareUrl = encodeURIComponent(shareUrl);

  const embedCode = `<iframe src="${siteUrl}" width="400" height="300" frameborder="0" style="border-radius:12px;overflow:hidden;"></iframe>`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    toast({ title: t("share.linkCopied") });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    toast({ title: t("share.embedCopied") });
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  // Use anchor click instead of window.open to avoid COOP issues in Firefox
  const openShareUrl = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: campaignTitle, url: siteUrl });
        return;
      } catch {
        // fall through to dialog
      }
    }
  };

  // Generate a 1080x1920 Instagram-story image
  const generateStoryImage = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);

      // Background gradient (brand greens)
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, "#0d4a2c");
      grad.addColorStop(1, "#1a7a4a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      const drawTextAndFinish = () => {
        // White card area for text
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        const cardY = 1180;
        const cardH = 600;
        ctx.beginPath();
        const r = 32;
        ctx.moveTo(60 + r, cardY);
        ctx.arcTo(1020, cardY, 1020, cardY + r, r);
        ctx.arcTo(1020, cardY + cardH, 1020 - r, cardY + cardH, r);
        ctx.arcTo(60, cardY + cardH, 60, cardY + cardH - r, r);
        ctx.arcTo(60, cardY, 60 + r, cardY, r);
        ctx.closePath();
        ctx.fill();

        // Brand line
        ctx.fillStyle = "#0d4a2c";
        ctx.font = "bold 40px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Заедно за Ботевград", 540, cardY + 80);

        // Title (wrapped, max 3 lines)
        ctx.fillStyle = "#111";
        ctx.font = "bold 64px sans-serif";
        const words = campaignTitle.split(" ");
        const lines: string[] = [];
        let line = "";
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (ctx.measureText(test).width > 920 && line) {
            lines.push(line);
            line = w;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);
        const shown = lines.slice(0, 3);
        if (lines.length > 3) shown[2] = shown[2].slice(0, -2) + "…";
        shown.forEach((l, i) => ctx.fillText(l, 540, cardY + 200 + i * 80));

        // CTA
        ctx.fillStyle = "#0d4a2c";
        ctx.font = "bold 44px sans-serif";
        ctx.fillText("Дарете сега 💚", 540, cardY + 520);

        // URL footer
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "32px sans-serif";
        ctx.fillText(siteUrl.replace(/^https?:\/\//, ""), 540, 1860);

        canvas.toBlob((b) => resolve(b), "image/png", 0.95);
      };

      if (campaignImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // Cover-fit image into top 1180px area
          const targetH = 1180;
          const targetW = 1080;
          const ratio = Math.max(targetW / img.width, targetH / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          const x = (targetW - w) / 2;
          const y = (targetH - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          drawTextAndFinish();
        };
        img.onerror = () => drawTextAndFinish();
        img.src = campaignImage;
      } else {
        drawTextAndFinish();
      }
    });
  };

  const handleInstagramShare = async () => {
    setGeneratingStory(true);
    try {
      const blob = await generateStoryImage();
      if (!blob) {
        toast({ title: t("share.storyError"), variant: "destructive" });
        return;
      }
      const file = new File([blob], `${campaignId}-story.png`, { type: "image/png" });

      // Copy link so user can paste into the story sticker
      try {
        await navigator.clipboard.writeText(siteUrl);
      } catch { /* ignore */ }

      // On mobile + share API supports files: open native share sheet (Instagram available there)
      const navAny = navigator as any;
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: campaignTitle, url: siteUrl });
          toast({ title: t("share.storyReady") });
          return;
        } catch {
          /* user cancelled — fall through to download */
        }
      }

      // Fallback: download image, copy link, try Instagram deep link on mobile
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${campaignId}-story.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      toast({
        title: t("share.storyDownloaded"),
        description: t("share.storyDownloadedDesc"),
      });

      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile) {
        setTimeout(() => openShareUrl("instagram://story-camera"), 800);
      }
    } finally {
      setGeneratingStory(false);
    }
  };

  const btnClass = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className={`${btnClass} shrink-0`} onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("share.title")}</DialogTitle>
          <DialogDescription>{t("share.desc")}</DialogDescription>
        </DialogHeader>

        {campaignImage && (
          <div className="aspect-video overflow-hidden rounded-lg bg-secondary">
            <img src={campaignImage} alt={campaignTitle} className="h-full w-full object-cover" />
          </div>
        )}

        <p className="text-sm font-medium">{campaignTitle}</p>

        {/* Copy link */}
        <div className="flex gap-2">
          <Input value={siteUrl} readOnly className="text-sm" />
          <Button variant="outline" size="icon" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="gap-2 text-sm"
            onClick={() => openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`)}
          >
            <Facebook className="h-4 w-4" /> Facebook
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-sm"
            onClick={handleInstagramShare}
            disabled={generatingStory}
          >
            {generatingStory ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Instagram className="h-4 w-4" />
            )}
            Instagram Story
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="gap-2 text-xs" onClick={handleInstagramShare} disabled={generatingStory}>
          <Download className="h-3 w-3" /> {t("share.downloadStory")}
        </Button>

        {/* Embed code */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("share.embedLabel")}</p>
          <div className="flex gap-2">
            <Input value={embedCode} readOnly className="text-xs font-mono" />
            <Button variant="outline" size="icon" onClick={copyEmbed}>
              {embedCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWidget;

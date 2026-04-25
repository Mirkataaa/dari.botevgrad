import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check, Facebook } from "lucide-react";
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
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Public site URL (where humans land directly when typing in browser)
  const siteUrl = `${window.location.origin}/campaign/${campaignId}`;
  // Crawler-facing URL: edge function returns OG-tagged HTML for social scrapers
  // (Facebook, Messenger, X, LinkedIn, etc.) and 302-redirects normal users
  // back to siteUrl. We use this URL EVERYWHERE the link will be shared so
  // previews always work — even when users copy/paste the link manually.
  const shareUrl = PROJECT_ID
    ? `https://${PROJECT_ID}.supabase.co/functions/v1/og-preview/${campaignId}?origin=${encodeURIComponent(window.location.origin)}&lang=${language}`
    : siteUrl;
  const encodedShareUrl = encodeURIComponent(shareUrl);

  const embedCode = `<iframe src="${siteUrl}" width="400" height="300" frameborder="0" style="border-radius:12px;overflow:hidden;"></iframe>`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
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
        await navigator.share({ title: campaignTitle, url: shareUrl });
        return;
      } catch {
        // fall through to dialog
      }
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
          <Input value={shareUrl} readOnly className="text-sm" />
          <Button variant="outline" size="icon" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {/* Social buttons */}
        <Button
          variant="outline"
          className="w-full gap-2 text-sm"
          onClick={() => openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`)}
        >
          <Facebook className="h-4 w-4" /> Facebook
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

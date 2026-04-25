import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Copy, Check } from "lucide-react";
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
  const [open, setOpen] = useState(false);

  // Public site URL (where humans land directly when typing in browser)
  const siteUrl = `${window.location.origin}/campaign/${campaignId}`;
  // Crawler-facing URL: edge function returns OG-tagged HTML for social scrapers
  // (Facebook, Messenger, X, LinkedIn, etc.) and 302-redirects normal users
  // back to siteUrl. We use this URL EVERYWHERE the link will be shared so
  // previews always work — even when users copy/paste the link manually.
  const shareUrl = PROJECT_ID
    ? `https://${PROJECT_ID}.supabase.co/functions/v1/og-preview/${campaignId}?origin=${encodeURIComponent(window.location.origin)}&lang=${language}`
    : siteUrl;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: t("share.linkCopied") });
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 800);
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
    <Dialog open={open} onOpenChange={setOpen}>
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

        {/* Facebook-style preview card */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {campaignImage && (
            <div className="aspect-video overflow-hidden bg-secondary">
              <img src={campaignImage} alt={campaignTitle} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-3">
            <p className="text-sm font-semibold line-clamp-2">{campaignTitle}</p>
          </div>
        </div>

        {/* Single copy button */}
        <Button onClick={copyLink} className="w-full gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t("share.linkCopied") : t("share.copyLink")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWidget;

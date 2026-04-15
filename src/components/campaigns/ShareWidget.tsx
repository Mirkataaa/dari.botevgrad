import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check, Facebook, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  campaignId: string;
  campaignTitle: string;
  campaignImage?: string;
  size?: "sm" | "default";
}

const ShareWidget = ({ campaignId, campaignTitle, campaignImage, size = "default" }: Props) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const url = `${window.location.origin}/campaign/${campaignId}`;
  const encodedUrl = encodeURIComponent(url);

  const embedCode = `<iframe src="${url}" width="400" height="300" frameborder="0" style="border-radius:12px;overflow:hidden;"></iframe>`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
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

  // Use window.location.assign instead of window.open to avoid COOP issues
  const openShareUrl = (shareUrl: string) => {
    const link = document.createElement("a");
    link.href = shareUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: campaignTitle, url });
        return;
      } catch {
        // fall through to dialog
      }
    }
  };

  const btnClass = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      onClick: () => openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
    },
    {
      name: "Instagram",
      icon: Instagram,
      onClick: () => {
        copyLink();
        toast({ title: t("share.instagramHint") });
      },
    },
  ];

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
          <Input value={url} readOnly className="text-sm" />
          <Button variant="outline" size="icon" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-2">
          {socialLinks.map((s) => (
            <Button
              key={s.name}
              variant="outline"
              className="gap-2 text-sm"
              onClick={s.onClick}
            >
              <s.icon className="h-4 w-4" /> {s.name}
            </Button>
          ))}
        </div>

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

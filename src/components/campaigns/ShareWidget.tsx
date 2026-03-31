import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check, Facebook, Twitter, Instagram, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  campaignId: string;
  campaignTitle: string;
  campaignImage?: string;
  size?: "sm" | "default";
}

const ShareWidget = ({ campaignId, campaignTitle, campaignImage, size = "default" }: Props) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const url = `${window.location.origin}/campaign/${campaignId}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(campaignTitle);

  const embedCode = `<iframe src="${url}" width="400" height="300" frameborder="0" style="border-radius:12px;overflow:hidden;"></iframe>`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Линкът е копиран!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    toast({ title: "Embed кодът е копиран!" });
    setTimeout(() => setEmbedCopied(false), 2000);
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
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: `https://www.instagram.com/`, // Instagram doesn't support URL sharing - we copy link
      action: copyLink,
    },
    {
      name: "Threads",
      icon: Link2,
      url: `https://www.threads.net/intent/post?text=${encodedTitle}%20${encodedUrl}`,
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
          <DialogTitle>Сподели кампанията</DialogTitle>
          <DialogDescription>Изберете начин за споделяне на кампанията с приятели.</DialogDescription>
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
              onClick={() => {
                if (s.action) {
                  s.action();
                  toast({ title: "Линкът е копиран! Споделете го в Instagram." });
                } else {
                  window.open(s.url, "_blank");
                }
              }}
            >
              <s.icon className="h-4 w-4" /> {s.name}
            </Button>
          ))}
        </div>

        {/* Embed code */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Embed код (iframe)</p>
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

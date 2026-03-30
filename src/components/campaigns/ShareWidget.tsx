import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check, Facebook, Twitter } from "lucide-react";
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
  const url = `${window.location.origin}/campaign/${campaignId}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(campaignTitle);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Линкът е копиран!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    // Try native Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({ title: campaignTitle, url });
        return;
      } catch {
        // User cancelled or not supported — fall through to dialog
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
          <DialogTitle>Сподели кампанията</DialogTitle>
          <DialogDescription>Изберете начин за споделяне на кампанията с приятели.</DialogDescription>
        </DialogHeader>

        {campaignImage && (
          <div className="aspect-video overflow-hidden rounded-lg bg-secondary">
            <img src={campaignImage} alt={campaignTitle} className="h-full w-full object-cover" />
          </div>
        )}

        <p className="text-sm font-medium">{campaignTitle}</p>

        <div className="flex gap-2">
          <Input value={url} readOnly className="text-sm" />
          <Button variant="outline" size="icon" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank")}
          >
            <Facebook className="h-4 w-4" /> Facebook
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, "_blank")}
          >
            <Twitter className="h-4 w-4" /> Twitter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWidget;

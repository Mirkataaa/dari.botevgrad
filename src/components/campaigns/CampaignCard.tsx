import { Link } from "react-router-dom";
import { ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CampaignProgress from "./CampaignProgress";
import ShareWidget from "./ShareWidget";
import type { Campaign } from "@/hooks/useCampaigns";

const categoryMap: Record<string, string> = {
  social: "Социални",
  healthcare: "Здравеопазване",
  education: "Образование",
  culture: "Култура",
  ecology: "Екология",
  infrastructure: "Инфраструктура",
};

const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
  const { id, title, short_description, target_amount, current_amount, status, category, images } = campaign;
  const isClosed = status === "completed" || status === "closed";
  const imageUrl = images?.[0];

  return (
    <Card className="group overflow-hidden border-border/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] bg-secondary">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        <Badge className="absolute left-3 top-3 bg-card/90 text-foreground backdrop-blur-sm hover:bg-card">
          {categoryMap[category] || category}
        </Badge>
        {isClosed && (
          <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground">
            {status === "closed" ? "Затворена" : "Приключила"}
          </Badge>
        )}
      </div>

      <CardContent className="space-y-4 p-5">
        <Link to={`/campaign/${id}`}>
          <h3 className="font-heading text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary line-clamp-2">
            {title}
          </h3>
        </Link>

        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {short_description || ""}
        </p>

        <CampaignProgress collected={Number(current_amount)} target={Number(target_amount)} size="sm" />

        <div className="flex items-center gap-2 pt-1">
          <Button asChild className="flex-1" size="sm" disabled={isClosed}>
            <Link to={`/campaign/${id}`}>
              {isClosed ? (status === "closed" ? "Затворена" : "Приключила") : "Дари сега"}
            </Link>
          </Button>
          <ShareWidget campaignId={id} campaignTitle={title} campaignImage={imageUrl} />
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignCard;

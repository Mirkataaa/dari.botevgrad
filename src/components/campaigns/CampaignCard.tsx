import { Link } from "react-router-dom";
import { Share2, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CampaignProgress from "./CampaignProgress";
import type { Campaign } from "@/data/mockCampaigns";

const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
  const { id, title, shortDescription, targetAmount, collectedAmount, isCompleted, category } = campaign;

  return (
    <Card className="group overflow-hidden border-border/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Image placeholder */}
      <div className="relative aspect-[16/10] bg-secondary">
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-10 w-10" />
        </div>
        <Badge className="absolute left-3 top-3 bg-card/90 text-foreground backdrop-blur-sm hover:bg-card">
          {category}
        </Badge>
        {isCompleted && (
          <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground">
            Приключила
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
          {shortDescription}
        </p>

        <CampaignProgress collected={collectedAmount} target={targetAmount} size="sm" />

        <div className="flex items-center gap-2 pt-1">
          <Button asChild className="flex-1" size="sm" disabled={isCompleted}>
            <Link to={`/campaign/${id}`}>
              {isCompleted ? "Приключила" : "Дари сега"}
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignCard;

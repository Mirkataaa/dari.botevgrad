import { Link } from "react-router-dom";
import { ImageIcon, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CampaignProgress from "./CampaignProgress";
import ShareWidget from "./ShareWidget";
import type { Campaign } from "@/hooks/useCampaigns";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const categoryKeyMap: Record<string, string> = {
  social: "cat.social",
  healthcare: "cat.healthcare",
  education: "cat.education",
  culture: "cat.culture",
  ecology: "cat.ecology",
  infrastructure: "cat.infrastructure",
  sports: "cat.sports",
};

const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
  const { t } = useLanguage();
  const { id, target_amount, current_amount, status, category, images } = campaign;
  const title = campaign.title;
  const short_description = campaign.short_description;
  const isClosed = status === "completed" || status === "closed";
  const isPending = status === "pending";
  const isRecurring = (campaign as any).campaign_type === "recurring";
  const mainIndex = (campaign as any).main_image_index || 0;
  const imageUrl = images?.[mainIndex] || images?.[0];
  const { isAdmin } = useIsAdmin();

  const { data: hasPendingDraft } = useQuery({
    queryKey: ["campaign-draft-status", id],
    queryFn: async () => {
      const { count } = await supabase
        .from("campaign_drafts")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", id)
        .eq("status", "pending_review");
      return (count || 0) > 0;
    },
    enabled: isAdmin,
  });

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
          {t(categoryKeyMap[category] || category)}
        </Badge>
        {isClosed && (
          <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground">
            {t("card.completed")}
          </Badge>
        )}
        {isPending && (
          <Badge className="absolute right-3 top-3 bg-amber-500 text-white">
            {t("card.pendingApproval")}
          </Badge>
        )}
        {hasPendingDraft && !isPending && (
          <Badge className="absolute right-3 top-10 bg-orange-500 text-white">
            {t("card.pendingDraft")}
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

        {!isRecurring && (
          <CampaignProgress collected={Number(current_amount)} target={Number(target_amount)} size="sm" />
        )}
        {isRecurring && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t("card.recurring")} · {Number(current_amount)} € {t("card.collected")}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button asChild className="flex-1" size="sm" disabled={isClosed}>
            <Link to={`/campaign/${id}`}>
              {isClosed ? t("card.completed") : isRecurring ? t("card.support") : t("card.donateNow")}
            </Link>
          </Button>
          <ShareWidget campaignId={id} campaignTitle={title} campaignImage={imageUrl} />
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignCard;

import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ImageIcon, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CampaignProgress from "@/components/campaigns/CampaignProgress";
import CampaignComments from "@/components/campaigns/CampaignComments";
import CampaignUpdates from "@/components/campaigns/CampaignUpdates";
import DonateButton from "@/components/campaigns/DonateButton";
import ShareWidget from "@/components/campaigns/ShareWidget";
import { useCampaign, useDonations } from "@/hooks/useCampaigns";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

const categoryMap: Record<string, string> = {
  social: "Социални",
  healthcare: "Здравеопазване",
  education: "Образование",
  culture: "Култура",
  ecology: "Екология",
  infrastructure: "Инфраструктура",
};

const CampaignDetails = () => {
  const { id } = useParams();
  const { data: campaign, isLoading } = useCampaign(id || "");
  const { data: donations = [] } = useDonations(id);

  useRealtimeSync("campaigns", [["campaign", id || ""], ["campaigns"], ["donations", id || ""]]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="font-heading text-2xl font-bold">Кампанията не е намерена</h1>
        <Button asChild variant="outline">
          <Link to="/active"><ArrowLeft className="mr-2 h-4 w-4" />Обратно</Link>
        </Button>
      </div>
    );
  }

  const isClosed = campaign.status === "completed" || campaign.status === "closed";
  const imageUrl = campaign.images?.[0];

  return (
    <div className="container py-8 md:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/active"><ArrowLeft className="mr-2 h-4 w-4" />Всички кампании</Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="aspect-video overflow-hidden rounded-xl bg-secondary">
            {imageUrl ? (
              <img src={imageUrl} alt={campaign.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-16 w-16" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />{categoryMap[campaign.category] || campaign.category}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />{new Date(campaign.created_at).toLocaleDateString("bg-BG")}
            </Badge>
            {isClosed && <Badge className="bg-primary text-primary-foreground">{campaign.status === "closed" ? "Затворена" : "Приключила"}</Badge>}
          </div>

          <h1 className="font-heading text-3xl font-bold md:text-4xl">{campaign.title}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{campaign.description}</p>

          <Separator />
          <CampaignUpdates campaignId={campaign.id} campaignCreatorId={campaign.created_by} />
          <Separator />
          <CampaignComments campaignId={campaign.id} />
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardContent className="space-y-6 p-6">
              <CampaignProgress collected={Number(campaign.current_amount)} target={Number(campaign.target_amount)} size="lg" />

              <div className="flex gap-3">
                <DonateButton campaignId={campaign.id} campaignTitle={campaign.title} disabled={isClosed} />
                <ShareWidget campaignId={campaign.id} campaignTitle={campaign.title} campaignImage={imageUrl} />
              </div>

              <Separator />

              <div>
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Последни дарения
                </h3>
                {donations.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">Все още няма дарения</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {donations.slice(0, 10).map((d) => (
                      <li key={d.id} className="flex items-start justify-between rounded-lg bg-secondary/60 p-3">
                        <div>
                          <p className="text-sm font-medium">{d.is_anonymous ? "Анонимен" : (d.donor_name || "Дарител")}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("bg-BG")}</p>
                        </div>
                        <span className="text-sm font-bold text-primary">{Number(d.amount)} €</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;

import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ImageIcon, Share2, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CampaignProgress from "@/components/campaigns/CampaignProgress";
import { getCampaignById } from "@/data/mockCampaigns";

const CampaignDetails = () => {
  const { id } = useParams();
  const campaign = getCampaignById(id || "");

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

  return (
    <div className="container py-8 md:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/active"><ArrowLeft className="mr-2 h-4 w-4" />Всички кампании</Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Image */}
          <div className="aspect-video overflow-hidden rounded-xl bg-secondary">
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-16 w-16" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />{campaign.category}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />{new Date(campaign.createdAt).toLocaleDateString("bg-BG")}
            </Badge>
            {campaign.isCompleted && <Badge className="bg-primary text-primary-foreground">Приключила</Badge>}
          </div>

          <h1 className="font-heading text-3xl font-bold md:text-4xl">{campaign.title}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{campaign.fullDescription}</p>

          {/* Video placeholder */}
          <div className="aspect-video overflow-hidden rounded-xl border bg-muted">
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <span className="text-sm">Видео / Галерия</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardContent className="space-y-6 p-6">
              <CampaignProgress collected={campaign.collectedAmount} target={campaign.targetAmount} size="lg" />

              <div className="flex gap-3">
                <Button className="flex-1" size="lg" disabled={campaign.isCompleted}>
                  {campaign.isCompleted ? "Приключила" : "Дари сега"}
                </Button>
                <Button variant="outline" size="icon" className="h-11 w-11">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Последни дарения
                </h3>
                <ul className="mt-3 space-y-3">
                  {campaign.donations.map((d) => (
                    <li key={d.id} className="flex items-start justify-between rounded-lg bg-secondary/60 p-3">
                      <div>
                        <p className="text-sm font-medium">{d.donorName}</p>
                        {d.message && <p className="mt-0.5 text-xs text-muted-foreground">„{d.message}"</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString("bg-BG")}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{d.amount} лв.</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;

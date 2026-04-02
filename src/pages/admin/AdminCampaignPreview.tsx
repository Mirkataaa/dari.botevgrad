import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Tag, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CampaignProgress from "@/components/campaigns/CampaignProgress";
import CampaignImageGallery from "@/components/campaigns/CampaignImageGallery";
import CampaignDocuments from "@/components/campaigns/CampaignDocuments";
import CampaignVersionHistory from "@/components/campaigns/CampaignVersionHistory";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusLabels: Record<string, string> = {
  pending: "Чакаща",
  active: "Активна",
  completed: "Завършена",
  rejected: "Отхвърлена",
  closed: "Приключена",
};

const categoryMap: Record<string, string> = {
  social: "Социални",
  healthcare: "Здравеопазване",
  education: "Образование",
  culture: "Култура",
  ecology: "Екология",
  infrastructure: "Инфраструктура",
};

const AdminCampaignPreview = () => {
  const { id } = useParams();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["admin-campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: donations = [] } = useQuery({
    queryKey: ["admin-donations", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("donations").select("*").eq("campaign_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="font-heading text-2xl font-bold">Кампанията не е намерена</h1>
        <Button asChild variant="outline">
          <Link to="/admin/campaigns"><ArrowLeft className="mr-2 h-4 w-4" />Назад</Link>
        </Button>
      </div>
    );
  }

  const images = campaign.images || [];
  const documents = campaign.documents || [];

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/admin/campaigns"><ArrowLeft className="mr-2 h-4 w-4" />Назад към кампании</Link>
      </Button>

      <div className="mb-4 flex items-center gap-2">
        <Badge variant="outline">{statusLabels[campaign.status] || campaign.status}</Badge>
        <Badge variant="secondary" className="gap-1">
          <Tag className="h-3 w-3" />{categoryMap[campaign.category] || campaign.category}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Calendar className="h-3 w-3" />{new Date(campaign.created_at).toLocaleDateString("bg-BG")}
        </Badge>
        {campaign.deadline && (
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />Краен срок: {new Date(campaign.deadline).toLocaleDateString("bg-BG")}
          </Badge>
        )}
      </div>

      <h1 className="font-heading text-3xl font-bold mb-4">{campaign.title}</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CampaignImageGallery images={images} title={campaign.title} />

          {campaign.short_description && (
            <p className="text-base font-medium text-foreground">{campaign.short_description}</p>
          )}

          <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>

          {documents.length > 0 && (
            <>
              <Separator />
              <CampaignDocuments documents={documents} />
            </>
          )}

          {campaign.videos && campaign.videos.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Видеа</h3>
                <ul className="space-y-2">
                  {campaign.videos.map((v: string, i: number) => (
                    <li key={i}>
                      <a href={v} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">{v}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <CampaignProgress collected={Number(campaign.current_amount)} target={Number(campaign.target_amount)} size="lg" />

              <Separator />

              <div>
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Дарения ({donations.length})
                </h3>
                {donations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Няма дарения</p>
                ) : (
                  <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {donations.map((d: any) => (
                      <li key={d.id} className="flex items-start justify-between rounded-lg bg-secondary/60 p-3">
                        <div>
                          <p className="text-sm font-medium">{d.is_anonymous ? "Анонимен" : (d.donor_name || "Дарител")}</p>
                          <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("bg-BG")}</p>
                          <p className="text-xs text-muted-foreground">Статус: {d.status}</p>
                        </div>
                        <span className="text-sm font-bold text-primary">{Number(d.amount)} €</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          <CampaignVersionHistory campaignId={campaign.id} />
        </div>
    </div>
  );
};

export default AdminCampaignPreview;

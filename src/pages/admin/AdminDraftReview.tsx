import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import CampaignImageGallery from "@/components/campaigns/CampaignImageGallery";
import CampaignDocuments from "@/components/campaigns/CampaignDocuments";
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";

const categoryMap: Record<string, string> = {
  social: "Социални", healthcare: "Здравеопазване", education: "Образование",
  culture: "Култура", ecology: "Екология", infrastructure: "Инфраструктура",
};

const AdminDraftReview = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: draft, isLoading } = useQuery({
    queryKey: ["draft", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_drafts")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: currentCampaign } = useQuery({
    queryKey: ["draft-campaign", draft?.campaign_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", draft.campaign_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!draft?.campaign_id,
  });

  const handleApprove = async () => {
    if (!draft || !user) return;
    setProcessing(true);
    try {
      // Apply draft changes to the campaign
      const { error: updateError } = await supabase.from("campaigns").update({
        title: draft.title,
        short_description: draft.short_description,
        description: draft.description,
        category: draft.category,
        target_amount: draft.target_amount,
        deadline: draft.deadline,
        images: draft.images,
        documents: draft.documents,
        videos: draft.videos,
        main_image_index: draft.main_image_index,
      }).eq("id", draft.campaign_id);
      if (updateError) throw updateError;

      // Mark draft as approved
      const { error: draftError } = await supabase.from("campaign_drafts")
        .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
        .eq("id", draft.id);
      if (draftError) throw draftError;

      toast({ title: "Редакцията е одобрена и приложена" });
      queryClient.invalidateQueries({ queryKey: ["pending-drafts"] });
      navigate("/admin/campaigns");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Грешка", description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!draft || !user || !rejectionReason.trim()) {
      toast({ variant: "destructive", title: "Моля, въведете причина за отхвърляне" });
      return;
    }
    setProcessing(true);
    try {
      // Mark draft as rejected
      const { error: draftError } = await supabase.from("campaign_drafts")
        .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
        .eq("id", draft.id);
      if (draftError) throw draftError;

      // Store rejection reason
      const { error: rejError } = await supabase.from("campaign_rejections" as any).insert({
        campaign_id: draft.campaign_id,
        draft_id: draft.id,
        rejected_by: user.id,
        reason: rejectionReason.trim(),
      });
      if (rejError) throw rejError;

      toast({ title: "Редакцията е отхвърлена" });
      queryClient.invalidateQueries({ queryKey: ["pending-drafts"] });
      navigate("/admin/campaigns");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Грешка", description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="font-heading text-2xl font-bold">Черновата не е намерена</h1>
        <Button asChild variant="outline">
          <Link to="/admin/campaigns"><ArrowLeft className="mr-2 h-4 w-4" />Назад</Link>
        </Button>
      </div>
    );
  }

  const draftImages = draft.images || [];
  const draftDocs = draft.documents || [];

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/admin/campaigns"><ArrowLeft className="mr-2 h-4 w-4" />Назад</Link>
      </Button>

      <div className="mb-4 flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold">Преглед на редакция</h1>
        <Badge className="bg-amber-100 text-amber-800">Чакаща одобрение</Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Draft (new version) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Предложена версия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CampaignImageGallery images={draftImages} title={draft.title} />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Заглавие</p>
              <p className="font-semibold">{draft.title}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Категория</p>
              <p>{categoryMap[draft.category] || draft.category}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Кратко описание</p>
              <p className="text-sm">{draft.short_description || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Описание</p>
              <p className="text-sm whitespace-pre-wrap">{draft.description}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Целева сума</p>
              <p>{Number(draft.target_amount).toLocaleString("bg-BG")} €</p>
            </div>
            {draft.deadline && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Краен срок</p>
                <p>{new Date(draft.deadline).toLocaleDateString("bg-BG")}</p>
              </div>
            )}
            {draftDocs.length > 0 && <CampaignDocuments documents={draftDocs} />}
          </CardContent>
        </Card>

        {/* Current live version */}
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Текуща версия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentCampaign ? (
              <>
                <CampaignImageGallery images={currentCampaign.images || []} title={currentCampaign.title} />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Заглавие</p>
                  <p className="font-semibold">{currentCampaign.title}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Категория</p>
                  <p>{categoryMap[currentCampaign.category] || currentCampaign.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Кратко описание</p>
                  <p className="text-sm">{currentCampaign.short_description || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Описание</p>
                  <p className="text-sm whitespace-pre-wrap">{currentCampaign.description}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Целева сума</p>
                  <p>{Number(currentCampaign.target_amount).toLocaleString("bg-BG")} €</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Зареждане...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Actions */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex gap-3">
            <Button onClick={handleApprove} disabled={processing} className="gap-1">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Одобри и приложи
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="font-medium text-sm">Отхвърляне с причина:</p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Опишете причината за отхвърляне..."
              rows={3}
              maxLength={2000}
            />
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectionReason.trim()} className="gap-1">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Отхвърли
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDraftReview;

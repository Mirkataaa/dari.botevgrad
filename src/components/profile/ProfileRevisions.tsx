import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileEdit, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Pencil, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Draft {
  id: string;
  campaign_id: string;
  status: string;
  created_at: string;
  title: string;
  reviewed_at: string | null;
  seen_at?: string | null;
}

interface Rejection {
  id: string;
  campaign_id: string;
  draft_id: string | null;
  reason: string;
  created_at: string;
  seen_at: string | null;
}

interface Campaign {
  id: string;
  title: string;
  status: string;
}

const draftStatusLabels: Record<string, string> = {
  pending_review: "Чакаща",
  approved: "Одобрена",
  rejected: "Отхвърлена",
};

const draftStatusColors: Record<string, string> = {
  pending_review: "border-border bg-secondary text-secondary-foreground",
  approved: "border-primary/30 bg-primary/10 text-primary",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

const ProfileRevisions = ({ highlightCampaignId }: { highlightCampaignId?: string | null }) => {
  const { user } = useAuth();
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(() => {
    return highlightCampaignId ? new Set([highlightCampaignId]) : new Set();
  });

  // Fetch all drafts for this user
  const { data: drafts = [], isLoading: draftsLoading } = useQuery({
    queryKey: ["my-all-drafts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_drafts")
        .select("id, campaign_id, status, created_at, title, reviewed_at, seen_at")
        .eq("submitted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Draft[];
    },
    enabled: !!user,
  });

  // Fetch rejections for this user's campaigns
  const { data: rejections = [], isLoading: rejectionsLoading } = useQuery({
    queryKey: ["my-all-rejections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_rejections")
        .select("id, campaign_id, draft_id, reason, created_at, seen_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Rejection[];
    },
    enabled: !!user,
  });

  // Get unique campaign IDs from drafts and rejections
  const campaignIds = [...new Set([
    ...drafts.map(d => d.campaign_id),
    ...rejections.map(r => r.campaign_id),
  ])];

  // Fetch campaign titles
  const { data: campaigns = [] } = useQuery({
    queryKey: ["revision-campaigns", campaignIds],
    queryFn: async () => {
      if (campaignIds.length === 0) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, title, status")
        .in("id", campaignIds);
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: campaignIds.length > 0,
  });

  const campaignMap = new Map(campaigns.map(c => [c.id, c]));
  const isLoading = draftsLoading || rejectionsLoading;

  // Filter out drafts/rejections whose campaign no longer exists in DB
  const existingCampaignIds = new Set(campaigns.map(c => c.id));
  const campaignsLoaded = campaignIds.length === 0 || campaigns.length > 0 || !isLoading;
  const visibleDrafts = campaignsLoaded
    ? drafts.filter(d => existingCampaignIds.has(d.campaign_id))
    : drafts;
  const visibleRejections = campaignsLoaded
    ? rejections.filter(r => existingCampaignIds.has(r.campaign_id))
    : rejections;

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (visibleDrafts.length === 0 && visibleRejections.length === 0) {
    return <p className="py-6 text-center text-muted-foreground">Няма редакции или одобрения.</p>;
  }

  // Group drafts by campaign
  const draftsByCampaign = new Map<string, Draft[]>();
  visibleDrafts.forEach(d => {
    const arr = draftsByCampaign.get(d.campaign_id) || [];
    arr.push(d);
    draftsByCampaign.set(d.campaign_id, arr);
  });

  // Group rejections by campaign
  const rejectionsByCampaign = new Map<string, Rejection[]>();
  visibleRejections.forEach(r => {
    const arr = rejectionsByCampaign.get(r.campaign_id) || [];
    arr.push(r);
    rejectionsByCampaign.set(r.campaign_id, arr);
  });

  const visibleCampaignIds = [...new Set([
    ...visibleDrafts.map(d => d.campaign_id),
    ...visibleRejections.map(r => r.campaign_id),
  ])];

  // Determine which campaigns need attention
  const campaignsWithPending = visibleCampaignIds.filter(id => {
    const cDrafts = draftsByCampaign.get(id) || [];
    return cDrafts.some(d => d.status === "pending_review");
  });

  const campaignsWithRejected = visibleCampaignIds.filter(id => {
    const cRejections = rejectionsByCampaign.get(id) || [];
    return cRejections.some(r => !r.seen_at);
  });

  // Sort: rejected first, then pending, then rest
  const sortedCampaignIds = [...visibleCampaignIds].sort((a, b) => {
    const aRej = campaignsWithRejected.includes(a) ? 0 : 1;
    const bRej = campaignsWithRejected.includes(b) ? 0 : 1;
    if (aRej !== bRej) return aRej - bRej;
    const aPend = campaignsWithPending.includes(a) ? 0 : 1;
    const bPend = campaignsWithPending.includes(b) ? 0 : 1;
    return aPend - bPend;
  });

  const toggleExpanded = (id: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {sortedCampaignIds.map(campaignId => {
        const campaign = campaignMap.get(campaignId);
        const cDrafts = draftsByCampaign.get(campaignId) || [];
        const cRejections = rejectionsByCampaign.get(campaignId) || [];
        const hasPending = cDrafts.some(d => d.status === "pending_review");
        const hasUnseenRejection = cRejections.some(r => !r.seen_at);
        const isExpanded = expandedCampaigns.has(campaignId);
        const isHighlighted = highlightCampaignId === campaignId;

        return (
          <Card
            key={campaignId}
            className={cn(
              "overflow-hidden transition-all",
              hasUnseenRejection && "ring-2 ring-destructive",
              isHighlighted && "ring-2 ring-primary shadow-lg",
            )}
          >
            <CardContent className="p-4">
              {/* Campaign header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileEdit className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <h3 className="font-semibold truncate">{campaign?.title || "Неизвестна кампания"}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasPending && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Clock className="mr-1 h-3 w-3" />Чакаща
                    </Badge>
                  )}
                  {hasUnseenRejection && (
                    <Badge variant="destructive" className="text-[10px]">
                      <XCircle className="mr-1 h-3 w-3" />Върната
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleExpanded(campaignId)}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Expanded history */}
              {isExpanded && (
                <div className="mt-4 space-y-3">
                  {/* Quick actions */}
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <Link to={`/campaign/${campaignId}`}>
                        <Eye className="h-3.5 w-3.5" />Виж
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <Link to={`/campaign/${campaignId}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />Редактирай
                      </Link>
                    </Button>
                  </div>

                  <Separator />

                  {/* Timeline of drafts & rejections merged and sorted by date */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">История</h4>
                     {(() => {
                       const rejectionByDraftId = new Map(
                         cRejections.filter((rejection) => rejection.draft_id).map((rejection) => [rejection.draft_id!, rejection])
                       );

                       const standaloneRejections = cRejections.filter(
                         (rejection) => !rejection.draft_id || !cDrafts.some((draft) => draft.id === rejection.draft_id)
                       );

                       type TimelineItem =
                         | { type: "revision"; draft: Draft; rejection?: Rejection; date: string }
                         | { type: "rejection"; rejection: Rejection; date: string };

                       const timeline: TimelineItem[] = [
                         ...cDrafts.map((draft) => ({
                           type: "revision" as const,
                           draft,
                           rejection: rejectionByDraftId.get(draft.id),
                           date: draft.reviewed_at || draft.created_at,
                         })),
                         ...standaloneRejections.map((rejection) => ({
                           type: "rejection" as const,
                           rejection,
                           date: rejection.created_at,
                         })),
                       ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                      if (timeline.length === 0) {
                        return <p className="text-sm text-muted-foreground">Няма записи.</p>;
                      }

                       return timeline.map((entry) => {
                         if (entry.type === "revision") {
                           const d = entry.draft;
                           const rejection = entry.rejection;
                           const eventDate = rejection?.created_at || d.reviewed_at || d.created_at;
                           const title = d.status === "approved"
                             ? "Одобрена"
                             : d.status === "rejected"
                               ? "Отхвърлена"
                               : "Чакаща";

                          return (
                            <div key={`d-${d.id}`} className="flex items-start gap-3 rounded-lg border p-3">
                              <div className="mt-0.5">
                                {d.status === "approved" ? (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                ) : d.status === "rejected" ? (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                ) : (
                                  <Clock className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                   <span className="text-sm font-medium">{title}</span>
                                  <Badge variant="outline" className={cn("text-[10px]", draftStatusColors[d.status])}>
                                    {draftStatusLabels[d.status] || d.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                   {new Date(eventDate).toLocaleDateString("bg-BG")} в {new Date(eventDate).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                                 {d.status === "rejected" && rejection?.reason && (
                                   <p className="mt-2 text-sm text-foreground">
                                     <span className="font-medium">Причина:</span> {rejection.reason}
                                   </p>
                                 )}
                              </div>
                            </div>
                          );
                        } else {
                           const r = entry.rejection;
                          return (
                            <div key={`r-${r.id}`} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-destructive" />
                                <span className="text-sm font-medium text-destructive">Отхвърлена</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(r.created_at).toLocaleDateString("bg-BG")} в {new Date(r.created_at).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className="text-sm text-destructive/80 pl-6">
                                <span className="font-medium">Причина:</span> {r.reason}
                              </p>
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProfileRevisions;

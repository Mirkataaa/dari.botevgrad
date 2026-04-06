import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export interface NotificationCounts {
  pendingCampaigns: number;
  pendingDrafts: number;
  contactMessages: number;
  approvedItems: number;
  rejectedItems: number;
  rejectedCampaignIds: string[];
  total: number;
}

const EMPTY: NotificationCounts = {
  pendingCampaigns: 0,
  pendingDrafts: 0,
  contactMessages: 0,
  approvedItems: 0,
  rejectedItems: 0,
  rejectedCampaignIds: [],
  total: 0,
};

export const useNotifications = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();

  // Realtime subscription to auto-refresh
  useEffect(() => {
    if (!user) return;

    const tables = ["campaigns", "campaign_drafts", "campaign_rejections", "contact_messages"];
    const channels = tables.map((table) =>
      supabase
        .channel(`notif-${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        })
        .subscribe()
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [user, queryClient]);

  return useQuery<NotificationCounts>({
    queryKey: ["notifications", user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return EMPTY;

      if (isAdmin) {
        const [campaignsRes, draftsRes, contactRes] = await Promise.all([
          supabase
            .from("campaigns")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("campaign_drafts")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending_review"),
          supabase
            .from("contact_messages")
            .select("id", { count: "exact", head: true })
            .eq("is_read", false),
        ]);

        const pendingCampaigns = campaignsRes.count || 0;
        const pendingDrafts = draftsRes.count || 0;
        const contactMessages = contactRes.count || 0;

        return {
          pendingCampaigns,
          pendingDrafts,
          contactMessages,
          approvedItems: 0,
          rejectedItems: 0,
          rejectedCampaignIds: [],
          total: pendingCampaigns + pendingDrafts + contactMessages,
        };
      }

      // For creators: notifications only for reviewed outcomes, never for newly submitted items.
      const [reviewedDraftsRes, rejectedCampaignsRes, ownCampaignsRes] = await Promise.all([
        supabase
          .from("campaign_drafts")
          .select("id, campaign_id, status, seen_at")
          .eq("submitted_by", user.id)
          .in("status", ["approved", "rejected"])
          .not("reviewed_at", "is", null)
          .is("seen_at", null),
        supabase
          .from("campaign_rejections")
          .select("campaign_id, draft_id")
          .is("seen_at", null),
        supabase
          .from("campaigns")
          .select("id")
          .eq("created_by", user.id),
      ]);

      const ownCampaignIds = new Set((ownCampaignsRes.data || []).map((c: any) => c.id));
      const reviewedDrafts = (reviewedDraftsRes.data || []).filter((draft: any) =>
        ownCampaignIds.has(draft.campaign_id)
      );

      const unseenStandaloneRejections = (rejectedCampaignsRes.data || []).filter(
        (rejection: any) => ownCampaignIds.has(rejection.campaign_id) && !rejection.draft_id
      );

      const approvedItems = reviewedDrafts.filter((draft: any) => draft.status === "approved").length;
      const rejectedDrafts = reviewedDrafts.filter((draft: any) => draft.status === "rejected");
      const rejectedItems = rejectedDrafts.length + unseenStandaloneRejections.length;
      const uniqueCampaignIds = [
        ...new Set([
          ...rejectedDrafts.map((draft: any) => draft.campaign_id),
          ...unseenStandaloneRejections.map((rejection: any) => rejection.campaign_id),
        ]),
      ];

      return {
        pendingCampaigns: 0,
        pendingDrafts: 0,
        contactMessages: 0,
        approvedItems,
        rejectedItems,
        rejectedCampaignIds: uniqueCampaignIds,
        total: approvedItems + rejectedItems,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};

export const markReviewNotificationsAsSeen = async (campaignId?: string) => {
  const { error } = await supabase.rpc("mark_review_notifications_seen", {
    _campaign_id: campaignId ?? null,
  });

  if (error) throw error;
};

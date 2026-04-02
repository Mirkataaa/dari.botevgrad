import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export interface NotificationCounts {
  pendingCampaigns: number;
  pendingDrafts: number;
  contactMessages: number;
  rejectedItems: number;
  rejectedCampaignIds: string[];
  total: number;
}

const EMPTY: NotificationCounts = {
  pendingCampaigns: 0,
  pendingDrafts: 0,
  contactMessages: 0,
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
          rejectedItems: 0,
          rejectedCampaignIds: [],
          total: pendingCampaigns + pendingDrafts + contactMessages,
        };
      }

      // For creators: only unseen rejections
      const { data: rejections } = await supabase
        .from("campaign_rejections")
        .select("campaign_id, campaigns!inner(created_by)")
        .is("seen_at", null);

      // Filter to own campaigns (RLS should handle this, but be safe)
      const ownRejections = (rejections || []).filter(
        (r: any) => r.campaigns?.created_by === user.id
      );

      const uniqueCampaignIds = [...new Set(ownRejections.map((r: any) => r.campaign_id))];

      return {
        pendingCampaigns: 0,
        pendingDrafts: 0,
        contactMessages: 0,
        rejectedItems: uniqueCampaignIds.length,
        rejectedCampaignIds: uniqueCampaignIds,
        total: uniqueCampaignIds.length,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};

/** Mark all unseen rejections for a campaign as seen */
export const markRejectionsAsSeen = async (campaignId: string) => {
  await supabase
    .from("campaign_rejections")
    .update({ seen_at: new Date().toISOString() })
    .eq("campaign_id", campaignId)
    .is("seen_at", null);
};

/** Mark all unseen rejections for the current user as seen */
export const markAllRejectionsAsSeen = async (campaignIds: string[]) => {
  if (campaignIds.length === 0) return;
  await supabase
    .from("campaign_rejections")
    .update({ seen_at: new Date().toISOString() })
    .in("campaign_id", campaignIds)
    .is("seen_at", null);
};

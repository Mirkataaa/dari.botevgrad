import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export interface NotificationCounts {
  pendingCampaigns: number;
  pendingDrafts: number;
  contactMessages: number;
  rejectedItems: number; // for creators
  total: number;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  return useQuery<NotificationCounts>({
    queryKey: ["notifications", user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return { pendingCampaigns: 0, pendingDrafts: 0, contactMessages: 0, rejectedItems: 0, total: 0 };

      if (isAdmin) {
        const [campaignsRes, draftsRes, contactRes] = await Promise.all([
          supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("campaign_drafts").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        ]);

        const pendingCampaigns = campaignsRes.count || 0;
        const pendingDrafts = draftsRes.count || 0;
        const contactMessages = contactRes.count || 0;

        return {
          pendingCampaigns,
          pendingDrafts,
          contactMessages,
          rejectedItems: 0,
          total: pendingCampaigns + pendingDrafts + contactMessages,
        };
      }

      // For creators: check rejected campaigns and drafts
      const [rejectedCampaignsRes, rejectedDraftsRes] = await Promise.all([
        supabase.from("campaigns").select("id", { count: "exact", head: true })
          .eq("created_by", user.id).eq("status", "rejected"),
        supabase.from("campaign_drafts").select("id", { count: "exact", head: true })
          .eq("submitted_by", user.id).eq("status", "rejected"),
      ]);

      const rejectedItems = (rejectedCampaignsRes.count || 0) + (rejectedDraftsRes.count || 0);

      return {
        pendingCampaigns: 0,
        pendingDrafts: 0,
        contactMessages: 0,
        rejectedItems,
        total: rejectedItems,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};

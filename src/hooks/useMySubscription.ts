import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActiveSubscription {
  id: string;
  campaign_id: string;
  amount: number;
  interval: string;
  status: string;
  current_period_end: string | null;
  stripe_subscription_id: string;
}

export const useMySubscriptionForCampaign = (campaignId?: string) => {
  const { user } = useAuth();
  return useQuery<ActiveSubscription | null>({
    queryKey: ["my-campaign-subscription", campaignId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, campaign_id, amount, interval, status, current_period_end, stripe_subscription_id")
        .eq("campaign_id", campaignId!)
        .eq("donor_id", user!.id)
        .in("status", ["active", "cancelling"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ActiveSubscription | null;
    },
    enabled: !!user && !!campaignId,
  });
};

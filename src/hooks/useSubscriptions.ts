import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Subscription {
  id: string;
  campaign_id: string;
  donor_id: string | null;
  donor_email: string;
  stripe_subscription_id: string;
  amount: number;
  interval: string;
  status: string;
  created_at: string;
  cancelled_at: string | null;
  current_period_end: string | null;
}

export const useMySubscriptions = () => {
  const { user } = useAuth();
  return useQuery<Subscription[]>({
    queryKey: ["my-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .eq("donor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Subscription[];
    },
    enabled: !!user,
  });
};

export const useCampaignSubscriptions = (campaignId?: string) => {
  return useQuery<Subscription[]>({
    queryKey: ["campaign-subscriptions", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .eq("campaign_id", campaignId!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Subscription[];
    },
    enabled: !!campaignId,
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { subscriptionId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["my-campaign-subscription"] });
      toast({ title: "Абонаментът е отменен", description: "Ще бъде спрян в края на текущия период." });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Грешка", description: err.message });
    },
  });
};

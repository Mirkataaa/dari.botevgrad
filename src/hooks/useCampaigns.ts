import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Campaign = Tables<"campaigns">;
export type Donation = Tables<"donations">;

export const useCampaigns = (status?: "active" | "completed") => {
  return useQuery({
    queryKey: ["campaigns", status],
    queryFn: async () => {
      let query = supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (status === "active") query = query.eq("status", "active");
      if (status === "completed") query = query.eq("status", "completed");
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useDonations = (campaignId?: string) => {
  return useQuery({
    queryKey: ["donations", campaignId],
    queryFn: async () => {
      let query = supabase.from("donations").select("*").eq("status", "completed").order("created_at", { ascending: false });
      if (campaignId) query = query.eq("campaign_id", campaignId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCampaignStats = () => {
  return useQuery({
    queryKey: ["campaign-stats"],
    queryFn: async () => {
      const [campaignsRes, donationsRes] = await Promise.all([
        supabase.from("campaigns").select("id", { count: "exact" }).in("status", ["active", "completed"]),
        supabase.from("donations").select("amount, donor_id").eq("status", "completed"),
      ]);
      const totalRaised = (donationsRes.data || []).reduce((sum, d) => sum + Number(d.amount), 0);
      const uniqueDonors = new Set((donationsRes.data || []).map(d => d.donor_id).filter(Boolean)).size;
      return {
        campaignCount: campaignsRes.count || 0,
        donorCount: uniqueDonors,
        totalRaised,
      };
    },
  });
};

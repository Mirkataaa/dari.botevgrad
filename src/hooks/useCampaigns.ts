import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Campaign = Tables<"campaigns">;
export type Donation = Tables<"donations">;

export interface PublicDonation {
  id: string;
  campaign_id: string;
  amount: number;
  donor_name: string | null;
  is_anonymous: boolean | null;
  status: string;
  created_at: string;
}

export const useCampaigns = (status?: "active" | "completed") => {
  return useQuery({
    queryKey: ["campaigns", status],
    queryFn: async () => {
      let query = supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (status === "active") query = query.eq("status", "active");
      if (status === "completed") query = query.in("status", ["completed", "closed"]);
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
  return useQuery<PublicDonation[]>({
    queryKey: ["donations", campaignId],
    queryFn: async () => {
      let query = supabase.from("public_donations" as any).select("id, campaign_id, donor_name, amount, is_anonymous, status, created_at").eq("status", "completed").order("created_at", { ascending: false });
      if (campaignId) query = query.eq("campaign_id", campaignId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PublicDonation[];
    },
  });
};

export const useCampaignStats = () => {
  return useQuery({
    queryKey: ["campaign-stats"],
    queryFn: async () => {
      const [campaignsRes, donationsRes] = await Promise.all([
        supabase.from("campaigns").select("id", { count: "exact" }).in("status", ["active", "completed"]),
        supabase.from("public_donations" as any).select("amount").eq("status", "completed"),
      ]);
      const rows = (donationsRes.data || []) as { amount: number }[];
      const totalRaised = rows.reduce((sum, d) => sum + Number(d.amount), 0);
      return {
        campaignCount: campaignsRes.count || 0,
        donorCount: 0,
        totalRaised,
      };
    },
  });
};

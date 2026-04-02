import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, HandCoins, Users, TrendingUp, AlertCircle } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    pendingCampaigns: 0,
    pendingDrafts: 0,
    totalDonations: 0,
    totalAmount: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [campaignsRes, donationsRes, profilesRes, draftsRes] = await Promise.all([
        supabase.from("campaigns").select("id, status"),
        supabase.from("donations").select("amount, status"),
        supabase.from("profiles").select("id"),
        supabase.from("campaign_drafts").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      ]);

      const campaigns = campaignsRes.data || [];
      const donations = (donationsRes.data || []).filter((d: any) => d.status === "completed");
      const profiles = profilesRes.data || [];

      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c: any) => c.status === "active").length,
        pendingCampaigns: campaigns.filter((c: any) => c.status === "pending").length,
        pendingDrafts: draftsRes.count || 0,
        totalDonations: donations.length,
        totalAmount: donations.reduce((sum: number, d: any) => sum + Number(d.amount), 0),
        totalUsers: profiles.length,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "Активни кампании", value: stats.activeCampaigns, icon: Megaphone, color: "text-primary" },
    { label: "Чакащи одобрение", value: stats.pendingCampaigns, icon: TrendingUp, color: "text-amber-500" },
    { label: "Общо дарения", value: `${stats.totalAmount.toLocaleString("bg-BG")} €`, icon: HandCoins, color: "text-emerald-600" },
    { label: "Регистрирани потребители", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">Табло</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

import { cn } from "@/lib/utils";
export default AdminDashboard;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, HandCoins, Users, AlertCircle, Mail, FileEdit, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  social: "Социални",
  healthcare: "Здравеопазване",
  education: "Образование",
  culture: "Култура",
  ecology: "Екология",
  infrastructure: "Инфраструктура",
  sports: "Спорт",
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    pendingCampaigns: 0,
    pendingDrafts: 0,
    unreadMessages: 0,
    totalDonations: 0,
    totalAmount: 0,
    totalUsers: 0,
  });
  const [categoryTotals, setCategoryTotals] = useState<{ category: string; total: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [campaignsRes, donationsRes, profilesRes, draftsRes, messagesRes] = await Promise.all([
        supabase.from("campaigns").select("id, status, category, current_amount"),
        supabase.from("donations").select("amount, status"),
        supabase.from("profiles").select("id"),
        supabase.from("campaign_drafts").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      ]);

      const campaigns = campaignsRes.data || [];
      const donations = (donationsRes.data || []).filter((d: any) => d.status === "completed");
      const profiles = profilesRes.data || [];

      // Aggregate raised amount per category from each campaign's current_amount
      const totals: Record<string, { total: number; count: number }> = {};
      Object.keys(categoryLabels).forEach((k) => { totals[k] = { total: 0, count: 0 }; });
      campaigns.forEach((c: any) => {
        if (!totals[c.category]) totals[c.category] = { total: 0, count: 0 };
        totals[c.category].total += Number(c.current_amount || 0);
        totals[c.category].count += 1;
      });
      const sortedCategoryTotals = Object.entries(totals)
        .map(([category, v]) => ({ category, total: v.total, count: v.count }))
        .sort((a, b) => b.total - a.total);

      setCategoryTotals(sortedCategoryTotals);
      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c: any) => c.status === "active").length,
        pendingCampaigns: campaigns.filter((c: any) => c.status === "pending").length,
        pendingDrafts: draftsRes.count || 0,
        unreadMessages: messagesRes.count || 0,
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
    { label: "Съобщения", value: stats.unreadMessages, icon: Mail, color: "text-blue-500" },
    { label: "Чакащи одобрение", value: stats.pendingCampaigns, icon: AlertCircle, color: "text-amber-500" },
    { label: "Чакащи редакции", value: stats.pendingDrafts, icon: FileEdit, color: "text-orange-500" },
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
    <div className="space-y-8">
      <div>
        <h1 className="mb-6 font-heading text-2xl font-bold">Табло</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Categories Summary */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Обобщение по категории</h2>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {categoryTotals.map((row) => (
                <div key={row.category} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-medium">{categoryLabels[row.category] || row.category}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.count} {row.count === 1 ? "кампания" : "кампании"}
                    </span>
                  </div>
                  <div className="font-semibold tabular-nums">
                    {row.total.toLocaleString("bg-BG")} €
                  </div>
                </div>
              ))}
              {categoryTotals.length === 0 && (
                <p className="px-5 py-6 text-center text-sm text-muted-foreground">Няма данни</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

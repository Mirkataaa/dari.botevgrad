import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

const statusLabels: Record<string, string> = {
  completed: "Завършено",
  pending: "Чакащо",
};

const AdminDonations = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");

  useRealtimeSync("campaigns", [["admin-donations"]]);

  const fetchDonations = async () => {
    let query = supabase
      .from("donations")
      .select("*, campaigns(title)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setDonations(data || []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchDonations();
  }, [filter]);

  // Re-fetch on realtime invalidation
  useEffect(() => {
    const channel = supabase
      .channel("admin-donations-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => {
        fetchDonations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 font-heading text-2xl font-bold">Дарения</h1>

      <div className="mb-6 flex gap-2">
        {(["all", "completed", "pending"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Всички" : statusLabels[f]}
          </Button>
        ))}
      </div>

      {donations.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Няма дарения</p>
      ) : (
        <div className="space-y-3">
          {donations.map((donation) => (
            <Card key={donation.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">
                    {donation.is_anonymous ? "Анонимен" : (donation.donor_name || "Неизвестен")}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    Кампания: {donation.campaigns?.title || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(donation.created_at).toLocaleDateString("bg-BG")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">
                    {Number(donation.amount).toLocaleString("bg-BG")} €
                  </span>
                  <Badge variant={donation.status === "completed" ? "default" : "secondary"}>
                    {statusLabels[donation.status] || donation.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDonations;

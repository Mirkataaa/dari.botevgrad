import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Pause, Play } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Чакаща",
  active: "Активна",
  completed: "Завършена",
  rejected: "Отхвърлена",
  stopped: "Спряна",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  stopped: "bg-gray-100 text-gray-800",
};

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setCampaigns(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const updateStatus = async (id: string, status: "pending" | "active" | "completed" | "rejected" | "stopped") => {
    const { error } = await supabase
      .from("campaigns")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
    } else {
      toast({ title: "Статусът е обновен" });
      fetchCampaigns();
    }
  };

  const filtered = filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">Управление на кампании</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "pending", "active", "completed", "rejected", "stopped"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Всички" : statusLabels[f]}
            {f !== "all" && (
              <span className="ml-1 text-xs">
                ({campaigns.filter((c) => c.status === f).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Няма кампании</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{campaign.title}</h3>
                    <Badge className={statusColors[campaign.status]} variant="secondary">
                      {statusLabels[campaign.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Number(campaign.current_amount).toLocaleString("bg-BG")} / {Number(campaign.target_amount).toLocaleString("bg-BG")} лв.
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {campaign.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(campaign.id, "active")}>
                        <Check className="mr-1 h-4 w-4" /> Одобри
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(campaign.id, "rejected")}>
                        <X className="mr-1 h-4 w-4" /> Отхвърли
                      </Button>
                    </>
                  )}
                  {campaign.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(campaign.id, "stopped")}>
                      <Pause className="mr-1 h-4 w-4" /> Спри
                    </Button>
                  )}
                  {campaign.status === "stopped" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(campaign.id, "active")}>
                      <Play className="mr-1 h-4 w-4" /> Активирай
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCampaigns;

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Search, Lock, Star, Play, Eye, Trash2, FileEdit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusLabels: Record<string, string> = {
  pending: "Чакаща",
  active: "Активна",
  completed: "Завършена",
  rejected: "Отхвърлена",
  closed: "Приключена",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  closed: "bg-purple-100 text-purple-800",
};

const categoryLabels: Record<string, string> = {
  social: "Социални",
  healthcare: "Здравеопазване",
  education: "Образование",
  culture: "Култура",
  ecology: "Екология",
  infrastructure: "Инфраструктура",
};

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setCampaigns(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  // Fetch pending drafts
  const { data: pendingDrafts = [] } = useQuery({
    queryKey: ["pending-drafts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_drafts" as any)
        .select("*, campaigns:campaign_id(title)")
        .eq("status", "pending_review")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("campaigns").update({ status } as any).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
    } else {
      toast({ title: "Статусът е обновен" });
      fetchCampaigns();
    }
  };

  const deleteCampaign = async (campaign: any) => {
    // Delete storage files first
    const buckets = [
      { bucket: "campaign-images", files: campaign.images },
      { bucket: "campaign-documents", files: campaign.documents },
    ];
    for (const { bucket, files } of buckets) {
      if (files && files.length > 0) {
        const paths = files.map((url: string) => {
          try {
            const parts = new URL(url).pathname.split("/");
            return parts.slice(parts.indexOf(bucket) + 1).join("/");
          } catch { return null; }
        }).filter(Boolean);
        if (paths.length > 0) {
          await supabase.storage.from(bucket).remove(paths);
        }
      }
    }
    // Delete campaign record
    const { error } = await supabase.from("campaigns").delete().eq("id", campaign.id);
    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
    } else {
      toast({ title: "Кампанията е изтрита" });
      fetchCampaigns();
    }
  };

  const toggleRecommended = async (id: string, current: boolean) => {
    const { error } = await supabase.from("campaigns").update({ is_recommended: !current } as any).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
    } else {
      toast({ title: !current ? "Кампанията е препоръчана" : "Кампанията вече не е препоръчана" });
      fetchCampaigns();
    }
  };

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.title.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [campaigns, filter, categoryFilter, search]);

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

      {/* Pending drafts section */}
      {pendingDrafts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 font-heading text-lg font-semibold text-amber-700">
            Чакащи редакции ({pendingDrafts.length})
          </h2>
          <div className="space-y-2">
            {pendingDrafts.map((draft: any) => (
              <Card key={draft.id} className="border-amber-200 bg-amber-50/50">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{draft.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Кампания: {(draft.campaigns as any)?.title || "—"} · {new Date(draft.created_at).toLocaleDateString("bg-BG")}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/drafts/${draft.id}`}>
                      <FileEdit className="mr-1 h-4 w-4" /> Прегледай
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Търсене..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        {["all", "pending", "active", "completed", "rejected", "closed"].map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "all" ? "Всички" : statusLabels[f]}
            {f !== "all" && <span className="ml-1 text-xs">({campaigns.filter((c) => c.status === f).length})</span>}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...Object.keys(categoryLabels)].map((c) => (
          <Button key={c} variant={categoryFilter === c ? "secondary" : "ghost"} size="sm" onClick={() => setCategoryFilter(c)}>
            {c === "all" ? "Всички категории" : categoryLabels[c]}
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
                    <Badge className={statusColors[campaign.status] || "bg-gray-100 text-gray-800"} variant="secondary">
                      {statusLabels[campaign.status] || campaign.status}
                    </Badge>
                    {campaign.is_recommended && (
                      <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
                        <Star className="mr-1 h-3 w-3" /> Препоръчана
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {categoryLabels[campaign.category] || campaign.category} · {Number(campaign.current_amount).toLocaleString("bg-BG")} / {Number(campaign.target_amount).toLocaleString("bg-BG")} €
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/admin/campaigns/${campaign.id}`}>
                      <Eye className="mr-1 h-4 w-4" /> Преглед
                    </Link>
                  </Button>

                  {["active", "completed", "closed"].includes(campaign.status) && (
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={!!campaign.is_recommended}
                        onCheckedChange={() => toggleRecommended(campaign.id, !!campaign.is_recommended)}
                      />
                      <Label className="text-xs">Препоръчана</Label>
                    </div>
                  )}

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
                    <Button size="sm" variant="outline" onClick={() => updateStatus(campaign.id, "closed")}>
                      <Lock className="mr-1 h-4 w-4" /> Приключи
                    </Button>
                  )}
                  {(campaign.status === "closed" || campaign.status === "completed") && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(campaign.id, "active")}>
                      <Play className="mr-1 h-4 w-4" /> Отвори отново
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Изтриване на кампания</AlertDialogTitle>
                        <AlertDialogDescription>
                          Сигурни ли сте, че искате да изтриете "{campaign.title}"? Това действие е необратимо и ще премахне всички свързани файлове.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отказ</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCampaign(campaign)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Изтрий
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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

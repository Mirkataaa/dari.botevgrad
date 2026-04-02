import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  campaignId: string;
}

const changeTypeLabels: Record<string, string> = {
  created: "Създадена",
  edited: "Редактирана",
  approved: "Одобрена",
  rejected: "Отхвърлена",
  status_change: "Промяна на статус",
  other: "Друго",
};

const CampaignVersionHistory = ({ campaignId }: Props) => {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["campaign-versions", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_versions" as any)
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (versions.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Няма записана история на промените.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
        <History className="h-5 w-5" /> История на промените ({versions.length})
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {versions.map((v: any) => {
          const snapshot = v.snapshot || {};
          return (
            <Card key={v.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{changeTypeLabels[v.change_type] || v.change_type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleString("bg-BG")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Заглавие: <span className="text-foreground font-medium">{snapshot.title || "—"}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Статус: <span className="text-foreground">{snapshot.status || "—"}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Сума: <span className="text-foreground">{Number(snapshot.target_amount || 0).toLocaleString("bg-BG")} €</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignVersionHistory;

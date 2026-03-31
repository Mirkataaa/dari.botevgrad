import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import VoteButtons from "@/components/VoteButtons";

interface Props {
  campaignId: string;
  campaignCreatorId: string | null;
}

const CampaignUpdates = ({ campaignId, campaignCreatorId }: Props) => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const canPost = user && (isAdmin || user.id === campaignCreatorId);

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ["campaign-updates", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_updates")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addUpdate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("campaign_updates").insert({
        campaign_id: campaignId,
        created_by: user!.id,
        title: title.trim(),
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["campaign-updates", campaignId] });
      toast({ title: "Актуализацията е добавена" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Грешка", description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addUpdate.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
          <Megaphone className="h-5 w-5" />
          Актуализации ({updates.length})
        </h2>
        {canPost && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Добави
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заглавие на актуализацията"
            maxLength={200}
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Съдържание..."
            rows={4}
            maxLength={5000}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Отказ</Button>
            <Button type="submit" size="sm" disabled={!title.trim() || !content.trim() || addUpdate.isPending}>
              {addUpdate.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Публикувай
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : updates.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Няма актуализации все още.</p>
      ) : (
        <div className="space-y-4">
          {updates.map((u: any) => (
            <div key={u.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold">{u.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("bg-BG")}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{u.content}</p>
              <VoteButtons targetId={u.id} table="update_votes" foreignKey="update_id" parentQueryKey={["campaign-updates", campaignId]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignUpdates;

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Trash2, Loader2, Pencil, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface Props {
  campaignId: string;
}

const CampaignComments = ({ campaignId }: Props) => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: comments = [], isLoading, error: commentsError } = useQuery({
    queryKey: ["comments", campaignId],
    queryFn: async () => {
      const { data: commentsData, error: commentsQueryError } = await supabase
        .from("comments")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (commentsQueryError) throw commentsQueryError;

      const userIds = Array.from(new Set((commentsData ?? []).map((c) => c.user_id)));
      if (userIds.length === 0) return commentsData ?? [];

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profilesById = new Map((profilesData ?? []).map((p) => [p.id, p]));

      return (commentsData ?? []).map((c) => ({
        ...c,
        profiles: profilesById.get(c.user_id) ?? null,
      }));
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("comments").insert({
        campaign_id: campaignId,
        user_id: user!.id,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["comments", campaignId] });
      queryClient.refetchQueries({ queryKey: ["comments", campaignId] });
      toast({ title: "Коментарът е добавен" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Грешка", description: err.message });
    },
  });

  const updateComment = useMutation({
    mutationFn: async ({ id, newContent }: { id: string; newContent: string }) => {
      const { error } = await supabase
        .from("comments")
        .update({ content: newContent.trim() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      setEditContent("");
      queryClient.invalidateQueries({ queryKey: ["comments", campaignId] });
      toast({ title: "Коментарът е редактиран" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Грешка", description: err.message });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", campaignId] });
      toast({ title: "Коментарът е изтрит" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate();
  };

  const startEditing = (comment: any) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
        <MessageSquare className="h-5 w-5" />
        Коментари ({comments.length})
      </h2>

      {user && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Напишете коментар..."
            rows={3}
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{content.length}/1000</span>
            <Button type="submit" size="sm" disabled={!content.trim() || addComment.isPending}>
              {addComment.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Публикувай
            </Button>
          </div>
        </form>
      )}

      {!user && (
        <p className="text-sm text-muted-foreground">Влезте в акаунта си, за да коментирате.</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : commentsError ? (
        <p className="py-6 text-center text-sm text-destructive">
          Неуспешно зареждане на коментарите.
        </p>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Все още няма коментари. Бъдете първи!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c: any) => (
            <div key={c.id} className="flex gap-3 rounded-lg border p-4">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {(c.profiles?.full_name || "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.profiles?.full_name || "Потребител"}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("bg-BG")}
                    </span>
                    {user?.id === c.user_id && editingId !== c.id && (
                      <button
                        onClick={() => startEditing(c)}
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {(user?.id === c.user_id || isAdmin) && (
                      <button
                        onClick={() => deleteComment.mutate(c.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      maxLength={1000}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                        <X className="mr-1 h-3.5 w-3.5" /> Отказ
                      </Button>
                      <Button
                        size="sm"
                        disabled={!editContent.trim() || updateComment.isPending}
                        onClick={() => updateComment.mutate({ id: c.id, newContent: editContent })}
                      >
                        {updateComment.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                        Запази
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{c.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignComments;

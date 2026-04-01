import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, List, LayoutGrid } from "lucide-react";

type ViewMode = "grouped" | "all";

const AdminComments = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const { toast } = useToast();

  const fetchComments = async () => {
    setLoading(true);
    // Fetch comments
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
      setLoading(false);
      return;
    }

    const items = commentsData || [];
    if (items.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    // Fetch profiles and campaigns in parallel
    const userIds = Array.from(new Set(items.map((c) => c.user_id)));
    const campaignIds = Array.from(new Set(items.map((c) => c.campaign_id)));

    const [profilesRes, campaignsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", userIds),
      supabase.from("campaigns").select("id, title").in("id", campaignIds),
    ]);

    const profilesMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p.full_name]));
    const campaignsMap = new Map((campaignsRes.data ?? []).map((c) => [c.id, c.title]));

    setComments(
      items.map((c) => ({
        ...c,
        _userName: profilesMap.get(c.user_id) || "Неизвестен",
        _campaignTitle: campaignsMap.get(c.campaign_id) || "—",
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
    } else {
      toast({ title: "Коментарът е изтрит" });
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Group by campaign
  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; comments: any[] }>();
    comments.forEach((c) => {
      const key = c.campaign_id;
      if (!map.has(key)) {
        map.set(key, { title: c._campaignTitle, comments: [] });
      }
      map.get(key)!.comments.push(c);
    });
    return Array.from(map.entries());
  }, [comments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const CommentRow = ({ comment }: { comment: any }) => (
    <div className="flex items-start justify-between gap-3 py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold">{comment._userName}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.created_at).toLocaleDateString("bg-BG")}
          </span>
        </div>
        <p className="text-sm">{comment.content}</p>
        {viewMode === "all" && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Кампания: {comment._campaignTitle}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="shrink-0 text-destructive hover:text-destructive"
        onClick={() => deleteComment(comment.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">
          Коментари ({comments.length})
        </h1>
        <div className="flex gap-1 border rounded-lg p-0.5">
          <Button
            size="sm"
            variant={viewMode === "grouped" ? "default" : "ghost"}
            onClick={() => setViewMode("grouped")}
          >
            <LayoutGrid className="mr-1 h-4 w-4" /> По кампания
          </Button>
          <Button
            size="sm"
            variant={viewMode === "all" ? "default" : "ghost"}
            onClick={() => setViewMode("all")}
          >
            <List className="mr-1 h-4 w-4" /> Всички
          </Button>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Няма коментари</p>
      ) : viewMode === "grouped" ? (
        <div className="space-y-4">
          {grouped.map(([campaignId, group]) => (
            <Card key={campaignId}>
              <CardContent className="p-4">
                <h3 className="font-heading font-bold text-base mb-2 text-primary">
                  {group.title}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({group.comments.length})
                  </span>
                </h3>
                <div className="divide-y">
                  {group.comments.map((c) => (
                    <CommentRow key={c.id} comment={c} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="divide-y">
              {comments.map((c) => (
                <CommentRow key={c.id} comment={c} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminComments;

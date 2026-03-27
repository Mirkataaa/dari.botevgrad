import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

const AdminComments = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, campaigns(title), profiles:user_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    setComments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, []);

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
    } else {
      toast({ title: "Коментарът е изтрит" });
      fetchComments();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">Коментари</h1>

      {comments.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Няма коментари</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold">
                      {comment.profiles?.full_name || "Неизвестен"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString("bg-BG")}
                    </span>
                  </div>
                  <p className="text-sm mb-1">{comment.content}</p>
                  <p className="text-xs text-muted-foreground">
                    Кампания: {comment.campaigns?.title || "—"}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => deleteComment(comment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminComments;

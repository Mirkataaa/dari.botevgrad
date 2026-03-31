import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  targetId: string;
  table: "comment_votes" | "update_votes";
  foreignKey: "comment_id" | "update_id";
}

interface Props {
  targetId: string;
  table: "comment_votes" | "update_votes";
  foreignKey: "comment_id" | "update_id";
  /** Parent query key to invalidate on vote change (for sorting) */
  parentQueryKey?: string[];
}

const VoteButtons = ({ targetId, table, foreignKey, parentQueryKey }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: votes = [] } = useQuery({
    queryKey: [table, targetId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(table)
        .select("user_id, vote_type")
        .eq(foreignKey, targetId);
      if (error) throw error;
      return data as { user_id: string; vote_type: string }[];
    },
  });

  const likes = votes.filter((v) => v.vote_type === "like").length;
  const dislikes = votes.filter((v) => v.vote_type === "dislike").length;
  const myVote = user ? votes.find((v) => v.user_id === user.id)?.vote_type : null;

  const handleVote = async (type: "like" | "dislike") => {
    if (!user) {
      toast({ variant: "destructive", title: "Влезте в акаунта си, за да гласувате" });
      return;
    }
    setBusy(true);
    try {
      if (myVote === type) {
        await (supabase as any).from(table).delete().eq(foreignKey, targetId).eq("user_id", user.id);
      } else if (myVote) {
        await (supabase as any).from(table).update({ vote_type: type }).eq(foreignKey, targetId).eq("user_id", user.id);
      } else {
        await (supabase as any).from(table).insert({ [foreignKey]: targetId, user_id: user.id, vote_type: type });
      }
      queryClient.invalidateQueries({ queryKey: [table, targetId] });
    } catch {
      toast({ variant: "destructive", title: "Грешка при гласуване" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-7 gap-1 px-2 text-xs", myVote === "like" && "text-primary bg-primary/10")}
        onClick={() => handleVote("like")}
        disabled={busy}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        {likes > 0 && likes}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-7 gap-1 px-2 text-xs", myVote === "dislike" && "text-destructive bg-destructive/10")}
        onClick={() => handleVote("dislike")}
        disabled={busy}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        {dislikes > 0 && dislikes}
      </Button>
    </div>
  );
};

export default VoteButtons;

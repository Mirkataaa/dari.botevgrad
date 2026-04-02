import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminContacts = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchAndMarkRead = async () => {
      const { data } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setMessages(data || []);
      setLoading(false);

      // Mark all unread messages as read
      const unread = (data || []).filter((m: any) => !m.is_read);
      if (unread.length > 0) {
        await Promise.all(
          unread.map((m: any) =>
            supabase.from("contact_messages").update({ is_read: true }).eq("id", m.id)
          )
        );
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    };
    fetchAndMarkRead();
  }, [queryClient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">Съобщения от формата</h1>

      {messages.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Няма съобщения</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{msg.name}</p>
                      <a href={`mailto:${msg.email}`} className="text-sm text-primary hover:underline">{msg.email}</a>
                      {!msg.is_read && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Ново</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString("bg-BG")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContacts;

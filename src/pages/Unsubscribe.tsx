import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, MailX } from "lucide-react";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <CardContent className="space-y-6 pt-8 pb-8">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Зареждане...</p>
            </>
          )}
          {status === "valid" && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <MailX className="h-10 w-10 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Отписване от имейли</h1>
              <p className="text-muted-foreground">
                Сигурни ли сте, че искате да се отпишете от имейл известията?
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} variant="destructive" className="w-full">
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Потвърди отписване
              </Button>
            </>
          )}
          {status === "success" && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Успешно отписване</h1>
              <p className="text-muted-foreground">Няма да получавате повече имейл известия.</p>
            </>
          )}
          {status === "already" && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <CheckCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Вече сте отписани</h1>
              <p className="text-muted-foreground">Вече сте се отписали от имейл известията.</p>
            </>
          )}
          {(status === "invalid" || status === "error") && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Невалиден линк</h1>
              <p className="text-muted-foreground">Този линк за отписване е невалиден или е изтекъл.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;

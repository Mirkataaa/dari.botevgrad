import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  campaignId: string;
  campaignTitle: string;
  disabled?: boolean;
}

const presetAmounts = [5, 10, 20, 50, 100];

const DonateButton = ({ campaignId, campaignTitle, disabled }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDonate = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1) {
      toast({ variant: "destructive", title: "Въведете валидна сума (мин. 1 €)" });
      return;
    }

    const isEmbeddedPreview = window.self !== window.top;
    const previewCheckoutWindow = isEmbeddedPreview ? window.open("", "_blank", "noopener,noreferrer") : null;

    setLoading(true);
    setError(null);
    try {
      console.log("[DonateButton] Invoking create-checkout...", { campaignId, amount: numAmount, isAnonymous });

      const { data, error: fnError } = await supabase.functions.invoke("create-checkout", {
        body: {
          campaignId,
          amount: numAmount,
          isAnonymous,
        },
      });

      console.log("[DonateButton] Response:", { data, fnError });

      if (fnError) {
        throw new Error(fnError.message || "Грешка при създаване на плащане");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        console.log("[DonateButton] Redirecting to:", data.url);

        if (previewCheckoutWindow && !previewCheckoutWindow.closed) {
          previewCheckoutWindow.location.href = data.url;
        } else {
          window.location.assign(data.url);
        }
      } else {
        throw new Error("Не беше получен линк за плащане");
      }
    } catch (err: any) {
      if (previewCheckoutWindow && !previewCheckoutWindow.closed) {
        previewCheckoutWindow.close();
      }

      console.error("[DonateButton] Error:", err);
      const msg = err.message || "Неуспешно създаване на плащане";
      setError(msg);
      toast({ variant: "destructive", title: "Грешка", description: msg });
    } finally {
      setLoading(false);
    }
  };
...
        <DialogHeader>
          <DialogTitle>Дари за "{campaignTitle}"</DialogTitle>
          <DialogDescription>Изберете сума за дарение. След това ще бъдете пренасочени към Stripe.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {presetAmounts.map((a) => (
              <Button
                key={a}
                type="button"
                variant={amount === String(a) ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(String(a))}
              >
                {a} €
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-amount">Друга сума (€)</Label>
            <Input
              id="custom-amount"
              type="number"
              min={1}
              max={100000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Въведете сума"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(c) => setIsAnonymous(c === true)}
            />
            <Label htmlFor="anonymous" className="text-sm font-normal">Дари анонимно</Label>
          </div>
          {!user && (
            <p className="text-xs text-muted-foreground">Може да дарите и без регистрация.</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button onClick={handleDonate} className="w-full" size="lg" disabled={loading || !amount}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
            Дари {amount ? `${amount} €` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonateButton;

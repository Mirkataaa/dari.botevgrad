import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  campaignId: string;
  campaignTitle: string;
  disabled?: boolean;
  isRecurring?: boolean;
}

const presetAmounts = [5, 10, 20, 50, 100];

const DonateButton = ({ campaignId, campaignTitle, disabled, isRecurring }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [interval, setInterval] = useState("month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDonate = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1) {
      toast({ variant: "destructive", title: "Въведете валидна сума (мин. 1 €)" });
      return;
    }

    if (isRecurring && !user) {
      toast({ variant: "destructive", title: "Трябва да влезете в профила си за абонамент" });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const functionName = isRecurring ? "create-subscription" : "create-checkout";
      const body = isRecurring
        ? { campaignId, amount: numAmount, interval }
        : { campaignId, amount: numAmount, isAnonymous };

      const { data, error: fnError } = await supabase.functions.invoke(functionName, { body });

      if (fnError) throw new Error(fnError.message || "Грешка при създаване на плащане");
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("Не беше получен линк за плащане");

      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      } catch {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      const msg = err?.message || "Неуспешно създаване на плащане";
      console.error("[DonateButton] Error", msg);
      setError(msg);
      toast({ variant: "destructive", title: "Грешка", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button className="flex-1" size="lg" disabled={disabled}>
          {isRecurring ? (
            <RefreshCw className="mr-2 h-4 w-4" />
          ) : (
            <Heart className="mr-2 h-4 w-4" />
          )}
          {disabled ? "Приключила" : isRecurring ? "Подкрепи месечно" : "Дари сега"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRecurring ? `Месечна подкрепа за "${campaignTitle}"` : `Дари за "${campaignTitle}"`}
          </DialogTitle>
          <DialogDescription>
            {isRecurring
              ? "Изберете сума за месечна подкрепа. Ще бъдете пренасочени към Stripe за абонамент."
              : "Изберете сума за дарение. След това ще бъдете пренасочени към Stripe."}
          </DialogDescription>
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

          {isRecurring && (
            <div className="space-y-2">
              <Label>Период на плащане</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Месечно</SelectItem>
                  <SelectItem value="year">Годишно</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!isRecurring && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(c) => setIsAnonymous(c === true)}
              />
              <Label htmlFor="anonymous" className="text-sm font-normal">
                Дари анонимно
              </Label>
            </div>
          )}

          {isRecurring && !user && (
            <p className="text-sm text-destructive">Трябва да влезете в профила си за абонамент.</p>
          )}

          {!isRecurring && !user && (
            <p className="text-xs text-muted-foreground">Може да дарите и без регистрация.</p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleDonate}
            className="w-full"
            size="lg"
            disabled={loading || !amount || (isRecurring && !user)}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isRecurring ? (
              <RefreshCw className="mr-2 h-4 w-4" />
            ) : (
              <Heart className="mr-2 h-4 w-4" />
            )}
            {isRecurring
              ? `Абонирай се ${amount ? `за ${amount} €/${interval === "month" ? "мес." : "год."}` : ""}`
              : `Дари ${amount ? `${amount} €` : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonateButton;

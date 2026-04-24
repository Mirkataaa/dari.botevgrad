import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Heart, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  campaignId: string;
  campaignTitle: string;
  disabled?: boolean;
  isRecurring?: boolean;
}

const presetAmounts = [5, 10, 20, 50, 100];

const DonateButton = ({ campaignId, campaignTitle, disabled, isRecurring }: Props) => {
  const { t } = useLanguage();
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
      toast({ variant: "destructive", title: t("donate.invalidAmount") });
      return;
    }
    if (isRecurring && !user) {
      toast({ variant: "destructive", title: t("donate.loginForSub") });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isRecurring) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw new Error(t("donate.sessionExpired"));
      }
      const functionName = isRecurring ? "create-subscription" : "create-checkout";
      // Non-authenticated donors are always anonymous
      const effectiveAnonymous = !user ? true : isAnonymous;
      const body = isRecurring
        ? { campaignId, amount: numAmount, interval }
        : { campaignId, amount: numAmount, isAnonymous: effectiveAnonymous };
      const { data, error: fnError } = await supabase.functions.invoke(functionName, { body });
      if (fnError) throw new Error(fnError.message || t("donate.error"));
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error(t("donate.noLink"));
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
      const msg = err?.message || t("donate.error");
      console.error("[DonateButton] Error", msg);
      setError(msg);
      toast({ variant: "destructive", title: t("common.error"), description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setError(null); }}>
      <DialogTrigger asChild>
        <Button className="flex-1" size="lg" disabled={disabled}>
          {isRecurring ? <RefreshCw className="mr-2 h-4 w-4" /> : <Heart className="mr-2 h-4 w-4" />}
          {disabled ? t("card.completed") : isRecurring ? t("donate.supportMonthly") : t("card.donateNow")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRecurring ? `${t("donate.titleRecurring")} "${campaignTitle}"` : `${t("donate.title")} "${campaignTitle}"`}
          </DialogTitle>
          <DialogDescription>
            {isRecurring ? t("donate.descRecurring") : t("donate.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {presetAmounts.map((a) => (
              <Button key={a} type="button" variant={amount === String(a) ? "default" : "outline"} size="sm" onClick={() => setAmount(String(a))}>
                {a} €
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount">{t("donate.otherAmount")}</Label>
            <Input id="custom-amount" type="number" min={1} max={100000} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t("donate.enterAmount")} />
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label>{t("donate.paymentPeriod")}</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">{t("donate.monthly")}</SelectItem>
                  <SelectItem value="year">{t("donate.yearly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!isRecurring && user && (
            <div className="flex items-center gap-2">
              <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(c) => setIsAnonymous(c === true)} />
              <Label htmlFor="anonymous" className="text-sm font-normal">{t("donate.anonymous")}</Label>
            </div>
          )}

          {isRecurring && !user && <p className="text-sm text-destructive">{t("donate.loginRequired")}</p>}
          {!isRecurring && !user && <p className="text-xs text-muted-foreground">{t("donate.noAccountNeeded")}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleDonate} className="w-full" size="lg" disabled={loading || !amount || (isRecurring && !user)}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isRecurring ? <RefreshCw className="mr-2 h-4 w-4" /> : <Heart className="mr-2 h-4 w-4" />}
            {isRecurring
              ? `${t("donate.subscribe")} ${amount ? `${t("donate.for")} ${amount} €/${interval === "month" ? t("details.perMonth") : t("details.perYear")}` : ""}`
              : `${t("donate.donate")} ${amount ? `${amount} €` : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonateButton;

import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Mail, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ForgotPassword = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    // Always show success message for security (don't reveal if account exists)
    if (error) {
      console.error("Reset password error:", error);
    }

    toast({
      title: t("auth.resetEmailSentTitle"),
      description: t("auth.resetEmailSent"),
    });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">
            {t("auth.forgotTitle")}
          </CardTitle>
          <CardDescription>{t("auth.forgotDesc")}</CardDescription>
        </CardHeader>

        {submitted ? (
          <>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.resetEmailSent")}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4" />
                  {t("auth.backToLogin")}
                </Link>
              </Button>
            </CardFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.sending") : t("auth.sendResetLink")}
              </Button>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                <ArrowLeft className="h-3 w-3" />
                {t("auth.backToLogin")}
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;

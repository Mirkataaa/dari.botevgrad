import { useState } from "react";
import {
  Heart, Shield, Users, Send, Loader2,
  CreditCard, Search, CheckCircle, ArrowRight,
  Lock, HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const values = [
    { icon: Heart, title: t("about.transparency"), description: t("about.transparencyDesc") },
    { icon: Shield, title: t("about.trust"), description: t("about.trustDesc") },
    { icon: Users, title: t("about.community"), description: t("about.communityDesc") },
  ];

  const steps = [
    { icon: Search, title: t("about.step1Title"), description: t("about.step1Desc") },
    { icon: CreditCard, title: t("about.step2Title"), description: t("about.step2Desc") },
    { icon: CheckCircle, title: t("about.step3Title"), description: t("about.step3Desc") },
    { icon: ArrowRight, title: t("about.step4Title"), description: t("about.step4Desc") },
  ];

  const faqs = Array.from({ length: 7 }, (_, i) => ({
    q: t(`faq.q${i + 1}`),
    a: t(`faq.a${i + 1}`),
  }));

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ variant: "destructive", title: t("about.fillAll") });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: t("about.invalidEmail") });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(), email: email.trim(), message: message.trim(),
    });
    setSending(false);
    if (error) {
      toast({ variant: "destructive", title: t("common.error"), description: error.message });
    } else {
      setName(""); setEmail(""); setMessage("");
      toast({ title: t("about.sent"), description: t("about.sentDesc") });
    }
  };

  return (
    <div className="container py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl font-bold md:text-4xl">{t("about.title")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          <strong>dari.botevgrad.bg</strong> {t("about.intro")}
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {values.map((v) => (
            <Card key={v.title} className="border-border/60 text-center">
              <CardContent className="flex flex-col items-center gap-3 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-14">
          <h2 className="font-heading text-2xl font-bold text-center">{t("about.howItWorks")}</h2>
          <p className="mt-2 text-center text-muted-foreground">{t("about.fourSteps")}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {steps.map((s, i) => (
              <div key={s.title} className="flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-heading font-bold">{s.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-lg">{t("about.transparencySection")}</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• {t("about.transparencyList1")}</li>
                <li>• {t("about.transparencyList2")}</li>
                <li>• {t("about.transparencyList3")}</li>
                <li>• {t("about.transparencyList4")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-lg">{t("about.feesTitle")}</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>{t("about.feesList1")}</strong> — {t("about.feesNote")}</li>
                <li>• {t("about.feesList2")}</li>
                <li>• {t("about.feesList3")}</li>
                <li>• {t("about.feesList4")}</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-lg">{t("about.securityTitle")}</h3>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <p>• {t("about.security1")} <strong>Stripe</strong> — {t("about.security1b")}</p>
                <p className="mt-1">• {t("about.security2")}</p>
              </div>
              <div>
                <p>• <strong>{t("about.security3")}</strong> {t("about.security3b")}</p>
                <p className="mt-1">• {t("about.security4")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-14">
          <div className="flex items-center justify-center gap-2 mb-6">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-2xl font-bold">{t("about.faqTitle")}</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-14 rounded-xl bg-secondary p-8">
          <h2 className="font-heading text-xl font-bold text-center">{t("about.contactTitle")}</h2>
          <p className="mt-2 text-center text-muted-foreground">{t("about.contactDesc")}</p>
          <form onSubmit={handleContact} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="contact-name">{t("about.nameLabel")} *</Label>
                <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("about.namePlaceholder")} maxLength={100} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact-email">{t("about.emailLabel")} *</Label>
                <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" maxLength={255} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact-msg">{t("about.messageLabel")} *</Label>
              <Textarea id="contact-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("about.messagePlaceholder")} rows={4} maxLength={2000} />
            </div>
            <Button type="submit" disabled={sending} className="w-full sm:w-auto">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t("about.send")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default About;

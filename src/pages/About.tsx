import { useState } from "react";
import {
  Heart, Shield, Users, Send, Loader2,
  CreditCard, Search, CheckCircle, ArrowRight,
  Lock, HelpCircle, ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const values = [
  {
    icon: Heart,
    title: "Прозрачност",
    description: "Всяка дарена стотинка е проследима. Публикуваме редовни отчети за всяка кампания.",
  },
  {
    icon: Shield,
    title: "Доверие",
    description: "Платформата е създадена и управлявана от Община Ботевград с цел гарантиране на сигурността.",
  },
  {
    icon: Users,
    title: "Общност",
    description: "Вярваме, че заедно можем да постигнем повече. Всеки принос, голям или малък, има значение.",
  },
];

const steps = [
  { icon: Search, title: "Изберете кампания", description: "Разгледайте активните кампании и изберете каузата, която ви вълнува." },
  { icon: CreditCard, title: "Направете дарение", description: "Изберете сума и завършете плащането чрез сигурната система на Stripe." },
  { icon: CheckCircle, title: "Получете потвърждение", description: "Получавате имейл потвърждение и дарението се отразява в кампанията." },
  { icon: ArrowRight, title: "Следете напредъка", description: "Следете как се развива кампанията и какво е постигнато с вашата помощ." },
];

const faqs = [
  {
    q: "Как мога да направя дарение?",
    a: 'Изберете кампания, натиснете „Дари сега", въведете желаната сума и завършете плащането чрез Stripe. Приемаме дебитни и кредитни карти, Apple Pay и Google Pay.',
  },
  {
    q: "Безопасно ли е да дарявам онлайн?",
    a: "Да. Всички плащания се обработват от Stripe — един от най-сигурните платежни процесори в света. Ние не съхраняваме данни за вашата карта.",
  },
  {
    q: "Има ли комисионна за дарението?",
    a: "Платформата dari.botevgrad.bg НЕ начислява комисионна. Stripe удържа стандартна такса от около 1.5% + 0.25€ за европейски карти. Цялата останала сума отива директно за каузата.",
  },
  {
    q: "Мога ли да даря анонимно?",
    a: "Да. При дарение можете да изберете да останете анонимен/на — вашето име няма да бъде показано публично.",
  },
  {
    q: "Как мога да създам кампания?",
    a: "Кампании могат да създават верифицирани организации и администратори. Свържете се с нас чрез формата за контакт за повече информация.",
  },
  {
    q: "Къде отиват парите от дарението?",
    a: "Средствата от всяка кампания се насочват директно към целта, описана в кампанията. Община Ботевград гарантира правилното разпределение на средствата.",
  },
  {
    q: "Мога ли да получа фактура за дарението си?",
    a: "След успешно плащане получавате имейл потвърждение с детайли за транзакцията. За официална фактура, моля свържете се с нас.",
  },
];

const About = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Моля, попълнете всички полета" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Невалиден имейл адрес" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    setSending(false);
    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
    } else {
      setName("");
      setEmail("");
      setMessage("");
      toast({ title: "Съобщението е изпратено!", description: "Ще се свържем с вас скоро." });
    }
  };

  return (
    <div className="container py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <h1 className="font-heading text-3xl font-bold md:text-4xl">За нас</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          <strong>dari.botevgrad.bg</strong> е дарителска платформа на Община Ботевград,
          създадена с цел да свърже хората с каузите, които имат значение за нашия град.
          Чрез прозрачност, доверие и общностен дух, ние правим даряването лесно и достъпно за всеки.
        </p>

        {/* Values */}
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

        {/* How it works */}
        <div className="mt-14">
          <h2 className="font-heading text-2xl font-bold text-center">Как работи платформата?</h2>
          <p className="mt-2 text-center text-muted-foreground">Четири прости стъпки до вашето дарение</p>
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

        {/* Transparency & Fees */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-lg">Прозрачност</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Всяко дарение се записва и е видимо в кампанията</li>
                <li>• Организаторите публикуват актуализации за напредъка</li>
                <li>• Община Ботевград наблюдава разпределението на средствата</li>
                <li>• Приключилите кампании остават видими с пълна история</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-lg">Такси и комисионни</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Платформена комисионна: 0%</strong> — ние не вземаме нищо</li>
                <li>• Stripe такса: ~1.5% + 0.25€ (европейски карти)</li>
                <li>• Stripe такса: ~2.9% + 0.25€ (международни карти)</li>
                <li>• Цялата останала сума отива директно за каузата</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Security */}
        <Card className="mt-6 border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-lg">Сигурност на плащанията</h3>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <p>• Плащанията се обработват от <strong>Stripe</strong> — глобален лидер в онлайн плащанията</p>
                <p className="mt-1">• PCI DSS Level 1 сертифициран (най-високо ниво на сигурност)</p>
              </div>
              <div>
                <p>• Ние <strong>не съхраняваме</strong> данни за вашата карта</p>
                <p className="mt-1">• SSL криптиране на всички данни при предаване</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-14">
          <div className="flex items-center justify-center gap-2 mb-6">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-2xl font-bold">Често задавани въпроси</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact form */}
        <div className="mt-14 rounded-xl bg-secondary p-8">
          <h2 className="font-heading text-xl font-bold text-center">Свържете се с нас</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Имате въпроси или предложения? Пишете ни!
          </p>
          <form onSubmit={handleContact} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="contact-name">Име *</Label>
                <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Вашето име" maxLength={100} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact-email">Имейл *</Label>
                <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" maxLength={255} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact-msg">Съобщение *</Label>
              <Textarea id="contact-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Вашето съобщение..." rows={4} maxLength={2000} />
            </div>
            <Button type="submit" disabled={sending} className="w-full sm:w-auto">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Изпрати
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default About;

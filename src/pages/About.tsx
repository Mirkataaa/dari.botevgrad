import { useState } from "react";
import { Heart, Shield, Users, Send, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
        <h1 className="font-heading text-3xl font-bold md:text-4xl">За нас</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          <strong>dari.botevgrad.bg</strong> е дарителска платформа на Община Ботевград,
          създадена с цел да свърже хората с каузите, които имат значение за нашия град.
          Чрез прозрачност, доверие и общностен дух, ние правим даряването лесно и достъпно за всеки.
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

        {/* Contact form */}
        <div className="mt-12 rounded-xl bg-secondary p-8">
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

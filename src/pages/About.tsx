import { Heart, Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

const About = () => (
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

      <div className="mt-12 rounded-xl bg-secondary p-8 text-center">
        <h2 className="font-heading text-xl font-bold">Имате въпроси?</h2>
        <p className="mt-2 text-muted-foreground">
          Свържете се с нас на <span className="font-medium text-foreground">info@botevgrad.bg</span> или
          посетете сградата на Община Ботевград.
        </p>
      </div>
    </div>
  </div>
);

export default About;

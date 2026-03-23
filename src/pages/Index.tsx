import { Link } from "react-router-dom";
import { ArrowRight, Heart, Users, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CampaignCard from "@/components/campaigns/CampaignCard";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { getActiveCampaigns, getFeaturedCampaigns } from "@/data/mockCampaigns";

const stats = [
  { icon: Heart, label: "Кампании", value: "6" },
  { icon: Users, label: "Дарители", value: "120+" },
  { icon: Target, label: "Събрани средства", value: "45 950 лв." },
];

const Index = () => {
  const featured = getFeaturedCampaigns();
  const active = getActiveCampaigns();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 py-20 text-primary-foreground md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(140_50%_90%/0.1),transparent_70%)]" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="font-heading text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Заедно за Ботевград
            </h1>
            <p className="mt-4 text-lg leading-relaxed opacity-90 md:text-xl">
              Дарителска платформа на Община Ботевград. Подкрепете каузите, които правят нашия град по-добро място за живеене.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="font-semibold">
                <Link to="/active">
                  Разгледай кампании
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-card py-8">
        <div className="container">
          <div className="grid grid-cols-3 divide-x">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 px-4 text-center">
                <stat.icon className="h-5 w-5 text-primary" />
                <span className="font-heading text-xl font-bold md:text-2xl">{stat.value}</span>
                <span className="text-xs text-muted-foreground md:text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carousel */}
      <section className="py-12 md:py-16">
        <div className="container">
          <h2 className="font-heading text-2xl font-bold md:text-3xl">Активни кампании</h2>
          <p className="mt-2 text-muted-foreground">Подкрепете кауза, която ви е близка</p>

          <div className="mt-8 px-12">
            <Carousel opts={{ align: "start", loop: true }}>
              <CarouselContent>
                {active.map((campaign) => (
                  <CarouselItem key={campaign.id} className="md:basis-1/2 lg:basis-1/3">
                    <CampaignCard campaign={campaign} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Featured grid */}
      <section className="bg-secondary/50 py-12 md:py-16">
        <div className="container">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold md:text-3xl">Препоръчани кампании</h2>
              <p className="mt-2 text-muted-foreground">Кампании, които се нуждаят от вашата помощ</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:flex">
              <Link to="/active">
                Виж всички <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Button asChild variant="outline">
              <Link to="/active">Виж всички кампании</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

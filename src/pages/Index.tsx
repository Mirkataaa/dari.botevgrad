import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, Heart, Users, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import CampaignCard from "@/components/campaigns/CampaignCard";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { useCampaigns, useCampaignStats } from "@/hooks/useCampaigns";
import { useLanguage } from "@/contexts/LanguageContext";

import hero1 from "@/assets/hero/hero-1.jpg";
import hero2 from "@/assets/hero/hero-2.jpeg";
import hero3 from "@/assets/hero/hero-3.jpg";
import hero4 from "@/assets/hero/hero-4.jpg";
import hero5 from "@/assets/hero/hero-5.jpg";

const heroImages = [hero1, hero2, hero3, hero4, hero5];

const Index = () => {
  const { t } = useLanguage();
  const { data: activeCampaigns = [] } = useCampaigns("active");
  const { data: stats } = useCampaignStats();
  const [currentImage, setCurrentImage] = useState(0);
  const recommended = activeCampaigns.filter((c: any) => c.is_recommended);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const statItems = [
    { icon: Heart, label: t("index.campaigns"), value: String(stats?.campaignCount || 0) },
    { icon: Users, label: t("index.donations"), value: String(stats?.donationCount || 0) },
    { icon: Target, label: t("index.raised"), value: `${(stats?.totalRaised || 0).toLocaleString("bg-BG")} €` },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 text-primary-foreground md:py-28">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentImage}
            src={heroImages[currentImage]}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="font-heading text-4xl font-extrabold leading-tight drop-shadow-lg md:text-5xl lg:text-6xl">
              {t("index.heroTitle")}
            </h1>
            <p className="mt-4 text-lg leading-relaxed opacity-90 drop-shadow-md md:text-xl">
              {t("index.heroDesc")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="font-semibold">
                <Link to="/active">
                  {t("index.browseCampaigns")}
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
            {statItems.map((stat) => (
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
      {activeCampaigns.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container">
            <h2 className="font-heading text-2xl font-bold md:text-3xl">{t("index.activeCampaigns")}</h2>
            <p className="mt-2 text-muted-foreground">{t("index.activeCampaignsDesc")}</p>

            <div className="mt-8 px-12">
              <Carousel opts={{ align: "start", loop: true }}>
                <CarouselContent>
                  {activeCampaigns.map((campaign) => (
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
      )}

      {/* Featured grid */}
      {recommended.length > 0 && (
        <section className="bg-secondary/50 py-12 md:py-16">
          <div className="container">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold md:text-3xl">{t("index.recommended")}</h2>
                <p className="mt-2 text-muted-foreground">{t("index.recommendedDesc")}</p>
              </div>
              <Button asChild variant="ghost" className="hidden sm:flex">
                <Link to="/active">
                  {t("index.viewAll")} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Button asChild variant="outline">
                <Link to="/active">{t("index.viewAllCampaigns")}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;

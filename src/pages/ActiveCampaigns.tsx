import CampaignCard from "@/components/campaigns/CampaignCard";
import { useCampaigns } from "@/hooks/useCampaigns";

const ActiveCampaigns = () => {
  const { data: campaigns = [], isLoading } = useCampaigns("active");

  return (
    <div className="container py-10 md:py-14">
      <h1 className="font-heading text-3xl font-bold md:text-4xl">Активни кампании</h1>
      <p className="mt-2 text-muted-foreground">Кампании, които в момента набират средства</p>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : campaigns.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">Няма активни кампании в момента</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveCampaigns;

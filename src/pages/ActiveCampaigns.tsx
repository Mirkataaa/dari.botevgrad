import CampaignCard from "@/components/campaigns/CampaignCard";
import { getActiveCampaigns } from "@/data/mockCampaigns";

const ActiveCampaigns = () => {
  const campaigns = getActiveCampaigns();

  return (
    <div className="container py-10 md:py-14">
      <h1 className="font-heading text-3xl font-bold md:text-4xl">Активни кампании</h1>
      <p className="mt-2 text-muted-foreground">Кампании, които в момента набират средства</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
};

export default ActiveCampaigns;

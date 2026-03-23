import CampaignCard from "@/components/campaigns/CampaignCard";
import { getCompletedCampaigns } from "@/data/mockCampaigns";

const CompletedCampaigns = () => {
  const campaigns = getCompletedCampaigns();

  return (
    <div className="container py-10 md:py-14">
      <h1 className="font-heading text-3xl font-bold md:text-4xl">Приключили кампании</h1>
      <p className="mt-2 text-muted-foreground">Успешно завършени кампании</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
};

export default CompletedCampaigns;

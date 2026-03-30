import { useCallback, useMemo, useState } from "react";
import CampaignCard from "@/components/campaigns/CampaignCard";
import CampaignFilters from "@/components/campaigns/CampaignFilters";
import { useCampaigns } from "@/hooks/useCampaigns";

const CompletedCampaigns = () => {
  const { data: campaigns = [], isLoading } = useCampaigns("completed");
  const [filters, setFilters] = useState({ search: "", category: "all" });

  const handleFilterChange = useCallback((f: { search: string; category: string }) => {
    setFilters(f);
  }, []);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (filters.category !== "all" && c.category !== filters.category) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!c.title.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [campaigns, filters]);

  return (
    <div className="container py-10 md:py-14">
      <h1 className="font-heading text-3xl font-bold md:text-4xl">Приключили кампании</h1>
      <p className="mt-2 text-muted-foreground">Успешно завършени кампании</p>

      <div className="mt-6">
        <CampaignFilters onFilterChange={handleFilterChange} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">Няма намерени кампании</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedCampaigns;

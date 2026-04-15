import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const categoryKeys = [
  { value: "all", key: "cat.all" },
  { value: "social", key: "cat.social" },
  { value: "healthcare", key: "cat.healthcare" },
  { value: "education", key: "cat.education" },
  { value: "culture", key: "cat.culture" },
  { value: "ecology", key: "cat.ecology" },
  { value: "infrastructure", key: "cat.infrastructure" },
];

interface Props {
  onFilterChange: (filters: { search: string; category: string }) => void;
}

const CampaignFilters = ({ onFilterChange }: Props) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange({ search, category });
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, category, onFilterChange]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("filters.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {categoryKeys.map((c) => (
          <Button
            key={c.value}
            variant={category === c.value ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(c.value)}
          >
            {t(c.key)}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CampaignFilters;

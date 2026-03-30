import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const categories = [
  { value: "all", label: "Всички" },
  { value: "social", label: "Социални инициативи" },
  { value: "healthcare", label: "Здравеопазване" },
  { value: "education", label: "Образование и наука" },
  { value: "culture", label: "Култура и традиции" },
  { value: "ecology", label: "Екология и животни" },
  { value: "infrastructure", label: "Инфраструктура" },
];

interface Props {
  onFilterChange: (filters: { search: string; category: string }) => void;
}

const CampaignFilters = ({ onFilterChange }: Props) => {
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
          placeholder="Търсене по ключова дума..."
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
        {categories.map((c) => (
          <Button
            key={c.value}
            variant={category === c.value ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CampaignFilters;

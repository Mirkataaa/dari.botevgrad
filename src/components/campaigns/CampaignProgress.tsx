import { cn } from "@/lib/utils";

interface CampaignProgressProps {
  collected: number;
  target: number;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

const CampaignProgress = ({ collected, target, size = "md", showLabels = true }: CampaignProgressProps) => {
  const percentage = target > 0 ? Math.min((collected / target) * 100, 100) : 0;

  const heightClass = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }[size];

  return (
    <div className="w-full">
      <div className={cn("w-full overflow-hidden rounded-full bg-secondary", heightClass)}>
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabels && (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">
            {collected.toLocaleString("bg-BG")} €
          </span>
          <span className="text-muted-foreground">
            от {target.toLocaleString("bg-BG")} € ({Math.round(percentage)}%)
          </span>
        </div>
      )}
    </div>
  );
};

export default CampaignProgress;

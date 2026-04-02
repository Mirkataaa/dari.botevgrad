import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NotificationBell = () => {
  const { data } = useNotifications();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const total = data?.total || 0;

  if (total === 0) return null;

  const handleClick = () => {
    if (isAdmin) {
      navigate("/admin");
    } else {
      navigate("/profile");
    }
  };

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={handleClick}>
      <Bell className="h-5 w-5" />
      <span className={cn(
        "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
      )}>
        {total > 99 ? "99+" : total}
      </span>
    </Button>
  );
};

export default NotificationBell;

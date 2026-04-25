import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Megaphone, HandCoins, MessageSquare, Mail, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { to: "/admin", label: "Табло", icon: LayoutDashboard, end: true },
  { to: "/admin/campaigns", label: "Кампании", icon: Megaphone },
  { to: "/admin/donations", label: "Дарения", icon: HandCoins },
  { to: "/admin/comments", label: "Коментари", icon: MessageSquare },
  { to: "/admin/contacts", label: "Съобщения", icon: Mail },
];

const AdminLayout = () => {
  const location = useLocation();

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card p-4 md:block">
        <div className="mb-6">
          <h2 className="font-heading text-lg font-bold text-foreground">Админ панел</h2>
          <p className="text-xs text-muted-foreground">Управление на платформата</p>
        </div>

        <nav className="flex flex-col gap-1">
          {adminLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(link.to, link.end)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 border-t pt-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Обратно към сайта
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="flex w-full flex-col">
        <div className="flex gap-1 overflow-x-auto border-b bg-card p-2 md:hidden">
          {adminLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                isActive(link.to, link.end)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;

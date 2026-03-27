import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogIn, LogOut, User, ShieldCheck, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import crestLogo from "@/assets/botevgrad-crest.jpg";

const navLinks = [
  { to: "/", label: "Начало" },
  { to: "/active", label: "Активни кампании" },
  { to: "/completed", label: "Приключили кампании" },
  { to: "/about", label: "За нас" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    if (!user) { setCanCreate(false); return; }
    const check = async () => {
      const { data } = await supabase.from("profiles").select("is_organization, organization_verified").eq("id", user.id).single();
      setCanCreate(!!data?.is_organization && !!data?.organization_verified);
    };
    check();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || "";
    if (user?.user_metadata?.full_name) {
      return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src={crestLogo} alt="Герб на Ботевград" className="h-8 w-auto sm:h-10 md:h-12" />
          <div className="hidden sm:block">
            <span className="font-heading text-lg font-bold text-foreground">Заедно за Ботевград</span>
            <p className="text-xs text-muted-foreground">Дарителска платформа</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === link.to
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* Auth buttons */}
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="ml-2 gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-xs text-primary font-semibold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline text-sm">
                        {user.user_metadata?.full_name || user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                      {user.email}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Админ панел
                      </DropdownMenuItem>
                    )}
                    {(isAdmin || canCreate) && (
                      <DropdownMenuItem onClick={() => navigate("/campaigns/create")}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Създай кампания
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Изход
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="ml-2 flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">
                      <LogIn className="mr-1.5 h-4 w-4" />
                      Вход
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register">Регистрация</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  location.pathname === link.to
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile auth */}
            {!loading && (
              <div className="mt-2 border-t pt-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {user.user_metadata?.full_name || user.email}
                    </div>
                    <button
                      onClick={() => { handleSignOut(); setMobileOpen(false); }}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-accent"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Изход
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" asChild onClick={() => setMobileOpen(false)}>
                      <Link to="/login">
                        <LogIn className="mr-1.5 h-4 w-4" />
                        Вход
                      </Link>
                    </Button>
                    <Button asChild onClick={() => setMobileOpen(false)}>
                      <Link to="/register">Регистрация</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;

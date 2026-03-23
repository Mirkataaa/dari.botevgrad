import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t bg-card">
    <div className="container py-8">
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <span className="font-heading text-sm font-bold">dari.botevgrad.bg</span>
        </div>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link to="/active" className="hover:text-foreground transition-colors">Кампании</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">За нас</Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Община Ботевград. Всички права запазени.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;

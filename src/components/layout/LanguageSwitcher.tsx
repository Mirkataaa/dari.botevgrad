import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-xs font-medium"
      onClick={() => setLanguage(language === "bg" ? "en" : "bg")}
    >
      <Globe className="h-3.5 w-3.5" />
      {language === "bg" ? "EN" : "BG"}
    </Button>
  );
};

export default LanguageSwitcher;

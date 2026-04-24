import { FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CampaignDocumentsProps {
  documents: string[];
}

const BUCKET = "campaign-documents";

const CampaignDocuments = ({ documents }: CampaignDocumentsProps) => {
  const { toast } = useToast();

  if (!documents || documents.length === 0) return null;

  const getFileName = (url: string) => {
    try {
      const parts = url.split("/");
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return "Документ";
    }
  };

  // Extract object path inside the bucket from a stored URL.
  // Stored values are typically full public URLs like:
  //   https://<proj>.supabase.co/storage/v1/object/public/campaign-documents/<path>
  // We extract everything after the bucket name.
  const extractObjectPath = (urlOrPath: string): string => {
    const marker = `/${BUCKET}/`;
    const idx = urlOrPath.indexOf(marker);
    if (idx >= 0) return decodeURIComponent(urlOrPath.slice(idx + marker.length));
    return urlOrPath; // already a path
  };

  const handleOpen = async (e: React.MouseEvent, urlOrPath: string) => {
    e.preventDefault();
    const path = extractObjectPath(urlOrPath);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 600);
    if (error || !data?.signedUrl) {
      toast({
        variant: "destructive",
        title: "Грешка",
        description: "Документът не може да бъде отворен. Моля, влезте в профила си.",
      });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Документи
      </h3>
      <div className="space-y-2">
        {documents.map((doc, i) => (
          <a
            key={i}
            href={doc}
            onClick={(e) => handleOpen(e, doc)}
            className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-secondary/60 cursor-pointer"
          >
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <span className="flex-1 truncate text-sm font-medium">{getFileName(doc)}</span>
            <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default CampaignDocuments;

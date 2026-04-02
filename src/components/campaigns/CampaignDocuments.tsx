import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CampaignDocumentsProps {
  documents: string[];
}

const CampaignDocuments = ({ documents }: CampaignDocumentsProps) => {
  if (!documents || documents.length === 0) return null;

  const getFileName = (url: string) => {
    try {
      const parts = url.split("/");
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return "Документ";
    }
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
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-secondary/60"
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

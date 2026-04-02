import { useState } from "react";
import { ImageIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CampaignImageGalleryProps {
  images: string[];
  title: string;
  aspectRatio?: "video" | "square";
}

const CampaignImageGallery = ({ images, title, aspectRatio = "video" }: CampaignImageGalleryProps) => {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className={cn("overflow-hidden rounded-xl bg-secondary", aspectRatio === "video" ? "aspect-video" : "aspect-square")}>
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-16 w-16" />
        </div>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <>
      <div className={cn("group relative overflow-hidden rounded-xl bg-secondary", aspectRatio === "video" ? "aspect-video" : "aspect-square")}>
        <img
          src={images[current]}
          alt={`${title} - ${current + 1}`}
          className="h-full w-full cursor-pointer object-cover transition-transform duration-300"
          onClick={() => setLightbox(true)}
        />

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              onClick={prev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              onClick={next}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    i === current ? "bg-primary-foreground w-4" : "bg-primary-foreground/50"
                  )}
                  onClick={() => setCurrent(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[current]}
              alt={`${title} - ${current + 1}`}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm"
                  onClick={prev}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm"
                  onClick={next}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            <p className="mt-2 text-center text-sm text-white/70">
              {current + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default CampaignImageGallery;

import { Video } from "lucide-react";

interface CampaignVideosProps {
  videos: string[];
}

const isYouTube = (url: string) => /youtube\.com\/watch|youtu\.be\//i.test(url);
const isVimeo = (url: string) => /vimeo\.com\//i.test(url);

const getYouTubeEmbed = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const getVimeoEmbed = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/i);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
};

const CampaignVideos = ({ videos }: CampaignVideosProps) => {
  if (!videos || videos.length === 0) return null;

  return (
    <div>
      <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <Video className="h-4 w-4" /> Видео
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {videos.map((url, i) => {
          if (isYouTube(url)) {
            const src = getYouTubeEmbed(url);
            if (!src) return null;
            return (
              <div key={i} className="aspect-video overflow-hidden rounded-lg border bg-secondary">
                <iframe
                  src={src}
                  title={`Видео ${i + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            );
          }
          if (isVimeo(url)) {
            const src = getVimeoEmbed(url);
            if (!src) return null;
            return (
              <div key={i} className="aspect-video overflow-hidden rounded-lg border bg-secondary">
                <iframe
                  src={src}
                  title={`Видео ${i + 1}`}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            );
          }
          return (
            <div key={i} className="aspect-video overflow-hidden rounded-lg border bg-secondary">
              <video src={url} controls preload="metadata" className="h-full w-full">
                Вашият браузър не поддържа видео.
              </video>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignVideos;

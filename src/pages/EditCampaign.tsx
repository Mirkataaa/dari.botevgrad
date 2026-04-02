import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCampaign } from "@/hooks/useCampaigns";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, X, Loader2, FileUp, Video, Star, AlertTriangle } from "lucide-react";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

type CampaignCategory = Database["public"]["Enums"]["campaign_category"];

const categories: { value: CampaignCategory; label: string }[] = [
  { value: "social", label: "Социални инициативи" },
  { value: "healthcare", label: "Здравеопазване" },
  { value: "education", label: "Образование и наука" },
  { value: "culture", label: "Култура и традиции" },
  { value: "ecology", label: "Екология и животни" },
  { value: "infrastructure", label: "Инфраструктура и благоустройство" },
];

const campaignSchema = z.object({
  title: z.string().trim().min(5, "Заглавието трябва да е поне 5 символа").max(200),
  short_description: z.string().trim().min(10, "Краткото описание трябва да е поне 10 символа").max(300),
  description: z.string().trim().min(30, "Описанието трябва да е поне 30 символа").max(10000),
  category: z.enum(["social", "healthcare", "education", "culture", "ecology", "infrastructure"]),
  target_amount: z.number().min(100, "Минимална сума: 100 €").max(1000000),
  deadline: z.string().optional(),
});

const EditCampaign = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: campaign, isLoading } = useCampaign(id || "");

  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CampaignCategory | "">("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingDocs, setExistingDocs] = useState<string[]>([]);
  const [newDocs, setNewDocs] = useState<File[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([""]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load rejections for this campaign
  const { data: rejections = [] } = useQuery({
    queryKey: ["campaign-rejections", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_rejections")
        .select("*")
        .eq("campaign_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Load pending draft
  const { data: pendingDraft } = useQuery({
    queryKey: ["campaign-draft", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_drafts")
        .select("*")
        .eq("campaign_id", id!)
        .eq("status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title);
      setShortDesc(campaign.short_description || "");
      setDescription(campaign.description);
      setCategory(campaign.category);
      setTargetAmount(String(campaign.target_amount));
      setDeadline(campaign.deadline ? new Date(campaign.deadline).toISOString().split("T")[0] : "");
      setExistingImages(campaign.images || []);
      setExistingDocs(campaign.documents || []);
      setVideoUrls(campaign.videos?.length ? campaign.videos : [""]);
      setMainImageIndex((campaign as any).main_image_index || 0);
    }
  }, [campaign]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="container py-10 text-center">Кампанията не е намерена</div>;
  }

  const isCreator = user?.id === campaign.created_by;
  const canEdit = isCreator || isAdmin;

  if (!canEdit) {
    return <div className="container py-10 text-center text-destructive">Нямате права да редактирате тази кампания</div>;
  }

  const allImages = [...existingImages, ...newImagePreviews];
  const totalImages = existingImages.length + newImages.length;

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (totalImages + files.length > 5) {
      toast({ variant: "destructive", title: "Максимум 5 снимки" });
      return;
    }
    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) { toast({ variant: "destructive", title: `${f.name} е твърде голям` }); return false; }
      if (!f.type.startsWith("image/")) { toast({ variant: "destructive", title: `${f.name} не е изображение` }); return false; }
      return true;
    });
    setNewImages(prev => [...prev, ...validFiles]);
    validFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    if (mainImageIndex >= existingImages.length - 1) setMainImageIndex(0);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDocAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (existingDocs.length + newDocs.length + files.length > 5) {
      toast({ variant: "destructive", title: "Максимум 5 документа" });
      return;
    }
    const validFiles = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) { toast({ variant: "destructive", title: `${f.name} е твърде голям` }); return false; }
      return true;
    });
    setNewDocs(prev => [...prev, ...validFiles]);
    e.target.value = "";
  };

  const handleVideoUrlChange = (index: number, value: string) => {
    setVideoUrls(prev => prev.map((v, i) => i === index ? value : v));
  };

  const uploadFiles = async (files: File[], bucket: string): Promise<string[]> => {
    if (!user) return [];
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = campaignSchema.safeParse({
      title, short_description: shortDesc, description,
      category: category || undefined,
      target_amount: Number(targetAmount),
      deadline: deadline || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach(issue => { fieldErrors[issue.path[0] as string] = issue.message; });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const [newImageUrls, newDocUrls] = await Promise.all([
        newImages.length > 0 ? uploadFiles(newImages, "campaign-images") : Promise.resolve([]),
        newDocs.length > 0 ? uploadFiles(newDocs, "campaign-documents") : Promise.resolve([]),
      ]);

      const allImageUrls = [...existingImages, ...newImageUrls];
      const allDocUrls = [...existingDocs, ...newDocUrls];
      const cleanVideoUrls = videoUrls.filter(v => v.trim().length > 0);

      if (isAdmin) {
        // Admins can directly update
        const { error } = await supabase.from("campaigns").update({
          title: parsed.data.title,
          short_description: parsed.data.short_description,
          description: parsed.data.description,
          category: parsed.data.category,
          target_amount: parsed.data.target_amount,
          deadline: parsed.data.deadline ? new Date(parsed.data.deadline).toISOString() : null,
          images: allImageUrls,
          documents: allDocUrls,
          videos: cleanVideoUrls,
          main_image_index: mainImageIndex,
        } as any).eq("id", campaign.id);
        if (error) throw error;
        toast({ title: "Кампанията е обновена" });
        navigate(`/campaign/${campaign.id}`);
      } else {
        // Creators submit a draft for review
        const { error } = await supabase.from("campaign_drafts").insert({
          campaign_id: campaign.id,
          submitted_by: user!.id,
          title: parsed.data.title,
          short_description: parsed.data.short_description,
          description: parsed.data.description,
          category: parsed.data.category,
          target_amount: parsed.data.target_amount,
          deadline: parsed.data.deadline ? new Date(parsed.data.deadline).toISOString() : null,
          images: allImageUrls,
          documents: allDocUrls,
          videos: cleanVideoUrls,
          main_image_index: mainImageIndex,
          status: "pending_review",
        });
        if (error) throw error;
        toast({ title: "Промените са изпратени за одобрение", description: "Администратор ще прегледа промените." });
        navigate("/profile");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Грешка", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10 md:py-14">
      <h1 className="mb-2 font-heading text-3xl font-bold">Редактиране на кампания</h1>
      <p className="mb-4 text-muted-foreground">
        {isAdmin ? "Промените ще бъдат приложени директно." : "Промените ще бъдат изпратени за одобрение от администратор."}
      </p>

      {pendingDraft && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          Вече имате чакаща редакция от {new Date(pendingDraft.created_at).toLocaleDateString("bg-BG")}. Нова редакция ще замести предишната.
        </div>
      )}

      {rejections.length > 0 && (
        <div className="mb-6 space-y-2">
          {rejections.slice(0, 3).map((r: any) => (
            <div key={r.id} className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-medium text-destructive">Причина за отхвърляне:</p>
              <p className="mt-1 text-foreground">{r.reason}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("bg-BG")}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Информация за кампанията</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Заглавие *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label>Категория *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CampaignCategory)}>
                <SelectTrigger><SelectValue placeholder="Изберете категория" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_desc">Кратко описание *</Label>
              <Textarea id="short_desc" value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={2} maxLength={300} />
              <p className="text-xs text-muted-foreground">{shortDesc.length}/300</p>
              {errors.short_description && <p className="text-sm text-destructive">{errors.short_description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Пълно описание *</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={6} maxLength={10000} />
              <p className="text-xs text-muted-foreground">{description.length}/10000</p>
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Целева сума (€) *</Label>
              <Input id="target" type="number" min={100} max={1000000} value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
              {errors.target_amount && <p className="text-sm text-destructive">{errors.target_amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Краен срок (по избор)</Label>
              <Input id="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>

            {/* Images with main image selection */}
            <div className="space-y-2">
              <Label>Снимки (до 5) — кликнете ★ за главна снимка</Label>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((src, i) => (
                  <div key={`existing-${i}`} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(i)} className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                      <X className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => setMainImageIndex(i)} className={`absolute left-1 top-1 rounded-full p-0.5 ${mainImageIndex === i ? 'bg-yellow-400 text-yellow-900' : 'bg-black/40 text-white'}`}>
                      <Star className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {newImagePreviews.map((src, i) => (
                  <div key={`new-${i}`} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeNewImage(i)} className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                      <X className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => setMainImageIndex(existingImages.length + i)} className={`absolute left-1 top-1 rounded-full p-0.5 ${mainImageIndex === existingImages.length + i ? 'bg-yellow-400 text-yellow-900' : 'bg-black/40 text-white'}`}>
                      <Star className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {totalImages < 5 && (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary">
                    <ImagePlus className="h-6 w-6" /><span className="mt-1 text-xs">Добави</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
                  </label>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-2">
              <Label>Документи (до 5)</Label>
              <div className="space-y-2">
                {existingDocs.map((url, i) => {
                  const name = decodeURIComponent(url.split("/").pop() || "Документ");
                  return (
                    <div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                      <FileUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{name}</span>
                      <button type="button" onClick={() => setExistingDocs(prev => prev.filter((_, idx) => idx !== i))} className="rounded-full bg-destructive p-0.5 text-destructive-foreground shrink-0">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
                {newDocs.map((doc, i) => (
                  <div key={`new-${i}`} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <FileUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{doc.name}</span>
                    <button type="button" onClick={() => setNewDocs(prev => prev.filter((_, idx) => idx !== i))} className="rounded-full bg-destructive p-0.5 text-destructive-foreground shrink-0">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {existingDocs.length + newDocs.length < 5 && (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-4 py-3 text-muted-foreground hover:border-primary hover:text-primary">
                    <FileUp className="h-5 w-5" /><span className="text-sm">Добави документ</span>
                    <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" multiple className="hidden" onChange={handleDocAdd} />
                  </label>
                )}
              </div>
            </div>

            {/* Videos */}
            <div className="space-y-2">
              <Label>Видео клипове (до 3)</Label>
              <div className="space-y-2">
                {videoUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input value={url} onChange={e => handleVideoUrlChange(i, e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="flex-1" />
                    {videoUrls.length > 1 && (
                      <button type="button" onClick={() => setVideoUrls(prev => prev.filter((_, idx) => idx !== i))} className="rounded-full bg-destructive p-0.5 text-destructive-foreground shrink-0">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                {videoUrls.length < 3 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setVideoUrls(prev => [...prev, ""])} className="gap-1">
                    <Video className="h-4 w-4" /> Добави видео
                  </Button>
                )}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Запазване...</> : isAdmin ? "Запази промените" : "Изпрати за одобрение"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCampaign;

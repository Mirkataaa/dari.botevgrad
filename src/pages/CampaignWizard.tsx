import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { Progress } from "@/components/ui/progress";
import {
  ImagePlus, X, Loader2, FileUp, Video, Star, RefreshCw,
  ChevronLeft, ChevronRight, Sparkles, Check, Info,
} from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type CampaignCategory = Database["public"]["Enums"]["campaign_category"];

const categories: { value: CampaignCategory; label: string }[] = [
  { value: "social", label: "Социални инициативи" },
  { value: "healthcare", label: "Здравеопазване" },
  { value: "education", label: "Образование и наука" },
  { value: "culture", label: "Култура и традиции" },
  { value: "ecology", label: "Екология и животни" },
  { value: "infrastructure", label: "Инфраструктура и благоустройство" },
  { value: "sports" as CampaignCategory, label: "Спорт" },
];

const basicsSchema = z.object({
  category: z.enum(["social", "healthcare", "education", "culture", "ecology", "infrastructure", "sports"], {
    required_error: "Изберете категория",
  }),
  title: z.string().trim().min(5, "Заглавието трябва да е поне 5 символа").max(200, "Максимум 200 символа"),
});

const storySchema = z.object({
  short_description: z.string().trim().min(10, "Краткото описание трябва да е поне 10 символа").max(300, "Максимум 300 символа"),
  description: z.string().trim().min(30, "Описанието трябва да е поне 30 символа").max(10000, "Максимум 10000 символа"),
});

const goalSchema = z.object({
  isRecurring: z.boolean(),
  target_amount: z.number().min(100, "Минимална сума: 100 €").max(1000000, "Максимална сума: 1 000 000 €").optional(),
  deadline: z.string().optional(),
}).refine((d) => d.isRecurring || (d.target_amount !== undefined && !Number.isNaN(d.target_amount)), {
  message: "Въведете целева сума",
  path: ["target_amount"],
});

const STEPS = [
  { id: 1, key: "basics", title: "Основа", desc: "Категория и заглавие" },
  { id: 2, key: "story", title: "История", desc: "Описание на каузата" },
  { id: 3, key: "goal", title: "Цел", desc: "Сума и срок" },
  { id: 4, key: "media", title: "Медия", desc: "Снимки, документи, видео" },
  { id: 5, key: "review", title: "Преглед", desc: "Изпрати за одобрение" },
];

const CampaignWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);

  // Basics
  const [category, setCategory] = useState<CampaignCategory | "">("");
  const [title, setTitle] = useState("");

  // Story
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");

  // Goal
  const [isRecurring, setIsRecurring] = useState(false);
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  // Media
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [documents, setDocuments] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------- Validation per step ----------
  const validateStep = (s: number): boolean => {
    setErrors({});
    if (s === 1) {
      const r = basicsSchema.safeParse({ category: category || undefined, title });
      if (!r.success) {
        const fe: Record<string, string> = {};
        r.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
        setErrors(fe);
        return false;
      }
      return true;
    }
    if (s === 2) {
      const r = storySchema.safeParse({ short_description: shortDesc, description });
      if (!r.success) {
        const fe: Record<string, string> = {};
        r.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
        setErrors(fe);
        return false;
      }
      return true;
    }
    if (s === 3) {
      const r = goalSchema.safeParse({
        isRecurring,
        target_amount: isRecurring ? undefined : (targetAmount ? Number(targetAmount) : undefined),
        deadline: deadline || undefined,
      });
      if (!r.success) {
        const fe: Record<string, string> = {};
        r.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
        setErrors(fe);
        return false;
      }
      return true;
    }
    if (s === 4) {
      if (images.length === 0) {
        setErrors({ images: "Добавете поне една снимка" });
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // ---------- Media handlers ----------
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast({ variant: "destructive", title: "Максимум 5 снимки" });
      return;
    }
    const valid = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: `${f.name} е твърде голям (макс. 5MB)` });
        return false;
      }
      if (!f.type.startsWith("image/")) {
        toast({ variant: "destructive", title: `${f.name} не е изображение` });
        return false;
      }
      return true;
    });
    setImages((p) => [...p, ...valid]);
    valid.forEach((f) => {
      const r = new FileReader();
      r.onload = (ev) => setImagePreviews((p) => [...p, ev.target?.result as string]);
      r.readAsDataURL(f);
    });
    e.target.value = "";
  };
  const removeImage = (i: number) => {
    setImages((p) => p.filter((_, idx) => idx !== i));
    setImagePreviews((p) => p.filter((_, idx) => idx !== i));
    if (mainImageIndex >= images.length - 1) setMainImageIndex(0);
  };

  const handleDocAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (documents.length + files.length > 5) {
      toast({ variant: "destructive", title: "Максимум 5 документа" });
      return;
    }
    const valid = files.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast({ variant: "destructive", title: `${f.name} е твърде голям (макс. 10MB)` });
        return false;
      }
      return true;
    });
    setDocuments((p) => [...p, ...valid]);
    e.target.value = "";
  };
  const removeDocument = (i: number) => setDocuments((p) => p.filter((_, idx) => idx !== i));

  const handleVideoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (videoFiles.length + files.length > 3) {
      toast({ variant: "destructive", title: "Максимум 3 видеоклипа" });
      return;
    }
    const valid = files.filter((f) => {
      if (!f.type.startsWith("video/")) {
        toast({ variant: "destructive", title: `${f.name} не е видео файл` });
        return false;
      }
      if (f.size > 100 * 1024 * 1024) {
        toast({ variant: "destructive", title: `${f.name} е твърде голям (макс. 100MB)` });
        return false;
      }
      return true;
    });
    setVideoFiles((p) => [...p, ...valid]);
    e.target.value = "";
  };
  const removeVideo = (i: number) => setVideoFiles((p) => p.filter((_, idx) => idx !== i));

  // ---------- Translate ----------
  const handleAutoTranslate = async () => {
    if (!title.trim() && !shortDesc.trim() && !description.trim()) {
      toast({ variant: "destructive", title: t("form.translateBgFirst") });
      return;
    }
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-campaign", {
        body: {
          title: title.trim() || undefined,
          short_description: shortDesc.trim() || undefined,
          description: description.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.title_en) setTitleEn(data.title_en);
      if (data?.short_description_en) setShortDescEn(data.short_description_en);
      if (data?.description_en) setDescriptionEn(data.description_en);
      toast({ title: t("form.translatedOk") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("form.translateError"), description: err.message });
    } finally {
      setTranslating(false);
    }
  };

  // ---------- Upload + submit ----------
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

  const handleSubmit = async () => {
    // Re-validate everything
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    setSubmitting(true);
    try {
      let finalTitleEn = titleEn.trim();
      let finalShortEn = shortDescEn.trim();
      let finalDescEn = descriptionEn.trim();
      if (!finalTitleEn && !finalShortEn && !finalDescEn) {
        try {
          const { data } = await supabase.functions.invoke("translate-campaign", {
            body: {
              title: title.trim(),
              short_description: shortDesc.trim(),
              description: description.trim(),
            },
          });
          if (data?.title_en) finalTitleEn = data.title_en;
          if (data?.short_description_en) finalShortEn = data.short_description_en;
          if (data?.description_en) finalDescEn = data.description_en;
        } catch (e) {
          console.warn("Auto-translate on submit failed (non-blocking)", e);
        }
      }

      const [imageUrls, docUrls, videoUploadedUrls] = await Promise.all([
        images.length > 0 ? uploadFiles(images, "campaign-images") : Promise.resolve([]),
        documents.length > 0 ? uploadFiles(documents, "campaign-documents") : Promise.resolve([]),
        videoFiles.length > 0 ? uploadFiles(videoFiles, "campaign-videos") : Promise.resolve([]),
      ]);

      const cleanVideoUrls = videoUploadedUrls;

      const { error } = await supabase.from("campaigns").insert({
        title: title.trim(),
        short_description: shortDesc.trim(),
        description: description.trim(),
        title_en: finalTitleEn || null,
        short_description_en: finalShortEn || null,
        description_en: finalDescEn || null,
        category: category as CampaignCategory,
        target_amount: isRecurring ? 0 : Number(targetAmount),
        deadline: isRecurring ? null : (deadline ? new Date(deadline).toISOString() : null),
        images: imageUrls,
        documents: docUrls,
        videos: cleanVideoUrls,
        created_by: user!.id,
        status: "pending",
        main_image_index: mainImageIndex,
        campaign_type: isRecurring ? "recurring" : "one_time",
      } as any);

      if (error) throw error;

      toast({
        title: "Кампанията е изпратена",
        description: "Очаква одобрение от администратор преди да стане публична.",
      });
      navigate("/profile");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Грешка", description: err.message || "Неуспешно създаване" });
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (step / STEPS.length) * 100;
  const currentStep = STEPS[step - 1];

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Създай кампания</h1>
          <p className="text-sm text-muted-foreground">
            Стъпков съветник за създаване. Кампанията ще премине през преглед от администратор.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="mb-6 grid grid-cols-5 gap-1.5 sm:gap-3">
        {STEPS.map((s) => {
          const isDone = s.id < step;
          const isCurrent = s.id === step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => s.id < step && setStep(s.id)}
              disabled={s.id > step}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors",
                isCurrent && "border-primary bg-primary/5",
                isDone && "border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10",
                !isCurrent && !isDone && "border-muted opacity-60",
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  isCurrent && "bg-primary text-primary-foreground",
                  isDone && "bg-primary/20 text-primary",
                  !isCurrent && !isDone && "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={cn("hidden sm:block text-xs font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Стъпка {step} от {STEPS.length}: {currentStep.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{currentStep.desc}</p>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* ---------- STEP 1: BASICS ---------- */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Категория *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as CampaignCategory)}>
                  <SelectTrigger><SelectValue placeholder="Изберете категория" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="w-title">Заглавие на кампанията *</Label>
                <Input
                  id="w-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Напр. Ремонт на детска площадка"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  Кратко и ясно — това виждат хората най-напред. ({title.length}/200)
                </p>
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>
            </>
          )}

          {/* ---------- STEP 2: STORY ---------- */}
          {step === 2 && (
            <Tabs defaultValue="bg" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bg">{t("form.langTab.bg")}</TabsTrigger>
                <TabsTrigger value="en">{t("form.langTab.en")}</TabsTrigger>
              </TabsList>

              <TabsContent value="bg" className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="w-short">Кратко описание *</Label>
                  <Textarea
                    id="w-short"
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    placeholder="Едно изречение, което се показва върху картата на кампанията"
                    rows={3}
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground">{shortDesc.length}/300</p>
                  {errors.short_description && <p className="text-sm text-destructive">{errors.short_description}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-desc">Пълно описание *</Label>
                  <Textarea
                    id="w-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Разкажете каузата подробно — защо е важно, какво ще се случи, как ще се използват средствата..."
                    rows={8}
                    maxLength={10000}
                  />
                  <p className="text-xs text-muted-foreground">{description.length}/10000</p>
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{t("form.translateHint")}</p>
                  <Button type="button" variant="outline" size="sm" onClick={handleAutoTranslate} disabled={translating} className="gap-2 shrink-0">
                    {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                    {translating ? t("form.translating") : t("form.autoTranslate")}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-title-en">{t("form.title_en")}</Label>
                  <Input id="w-title-en" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-short-en">{t("form.short_desc_en")}</Label>
                  <Textarea id="w-short-en" value={shortDescEn} onChange={(e) => setShortDescEn(e.target.value)} rows={3} maxLength={300} />
                  <p className="text-xs text-muted-foreground">{shortDescEn.length}/300</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-desc-en">{t("form.description_en")}</Label>
                  <Textarea id="w-desc-en" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={8} maxLength={10000} />
                  <p className="text-xs text-muted-foreground">{descriptionEn.length}/10000</p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* ---------- STEP 3: GOAL ---------- */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label htmlFor="w-recurring" className="text-sm font-medium">Периодична кампания</Label>
                  <p className="text-xs text-muted-foreground">Позволява абонаментни дарения (месечни/годишни). Без целева сума и без срок.</p>
                </div>
                <Switch id="w-recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>

              {!isRecurring && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="w-target">Целева сума (€) *</Label>
                    <Input
                      id="w-target"
                      type="number"
                      min={100}
                      max={1000000}
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="10000"
                    />
                    <p className="text-xs text-muted-foreground">Между 100 € и 1 000 000 €.</p>
                    {errors.target_amount && <p className="text-sm text-destructive">{errors.target_amount}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="w-deadline">Краен срок (по избор)</Label>
                    <Input
                      id="w-deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <p className="text-xs text-muted-foreground">Кампанията се затваря автоматично след тази дата.</p>
                  </div>
                </>
              )}

              {isRecurring && (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Периодичните кампании събират редовни дарения без фиксирана цел или срок. Можете да продължите към следващата стъпка.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ---------- STEP 4: MEDIA ---------- */}
          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label>Снимки (до 5) — кликнете ★ за главна *</Label>
                <div className="flex flex-wrap gap-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                        <X className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMainImageIndex(i)}
                        className={`absolute left-1 top-1 rounded-full p-0.5 ${mainImageIndex === i ? "bg-yellow-400 text-yellow-900" : "bg-black/40 text-white"}`}
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                      <ImagePlus className="h-6 w-6" />
                      <span className="mt-1 text-xs">Добави</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
                    </label>
                  )}
                </div>
                {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}
              </div>

              <div className="space-y-2">
                <Label>Документи (до 5, по избор)</Label>
                <p className="text-xs text-muted-foreground">PDF, Word, Excel и други документи до 10MB.</p>
                <div className="space-y-2">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                      <FileUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{doc.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button type="button" onClick={() => removeDocument(i)} className="rounded-full bg-destructive p-0.5 text-destructive-foreground shrink-0">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {documents.length < 5 && (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-4 py-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                      <FileUp className="h-5 w-5" />
                      <span className="text-sm">Добави документ</span>
                      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" multiple className="hidden" onChange={handleDocAdd} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Видео клипове (до 3, по избор)</Label>
                <p className="text-xs text-muted-foreground">Качете видео файлове от компютъра си (макс. 100MB всеки).</p>
                <div className="space-y-2">
                  {videoFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                      <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button type="button" onClick={() => removeVideo(i)} className="rounded-full bg-destructive p-0.5 text-destructive-foreground shrink-0">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {videoFiles.length < 3 && (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-4 py-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                      <Video className="h-5 w-5" />
                      <span className="text-sm">Добави видео файл</span>
                      <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoAdd} />
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ---------- STEP 5: REVIEW ---------- */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="rounded-lg border bg-primary/5 p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">
                  Кампанията ще бъде изпратена за <strong>преглед от администратор</strong> и ще стане публична след одобрение.
                </p>
              </div>

              <div className="grid gap-3 text-sm">
                <ReviewRow label="Категория" value={categories.find((c) => c.value === category)?.label || "—"} />
                <ReviewRow label="Тип" value={isRecurring ? "Периодична" : "Еднократна"} />
                <ReviewRow label="Заглавие" value={title} />
                <ReviewRow label="Кратко описание" value={shortDesc} />
                {!isRecurring && (
                  <>
                    <ReviewRow label="Целева сума" value={`${targetAmount} €`} />
                    <ReviewRow label="Краен срок" value={deadline || "—"} />
                  </>
                )}
                <ReviewRow label="Снимки" value={`${images.length} (главна #${mainImageIndex + 1})`} />
                <ReviewRow label="Документи" value={String(documents.length)} />
                <ReviewRow label="Видео" value={String(videoFiles.length)} />
              </div>

              {imagePreviews.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Преглед на снимките</p>
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className={cn("relative h-20 w-20 overflow-hidden rounded-md border", i === mainImageIndex && "ring-2 ring-primary")}>
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- Navigation ---------- */}
          <div className="flex items-center justify-between gap-3 border-t pt-5">
            <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || submitting} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Назад
            </Button>

            {step < STEPS.length ? (
              <Button type="button" onClick={goNext} className="gap-1">
                Напред <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Изпращане...</> : <><Check className="h-4 w-4" />Изпрати за одобрение</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-0">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="font-medium text-right break-words">{value}</span>
  </div>
);

export default CampaignWizard;

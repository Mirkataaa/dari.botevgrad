import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, X, Loader2 } from "lucide-react";
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
  title: z.string().trim().min(5, "Заглавието трябва да е поне 5 символа").max(200, "Максимум 200 символа"),
  short_description: z.string().trim().min(10, "Краткото описание трябва да е поне 10 символа").max(300, "Максимум 300 символа"),
  description: z.string().trim().min(30, "Описанието трябва да е поне 30 символа").max(10000, "Максимум 10000 символа"),
  category: z.enum(["social", "healthcare", "education", "culture", "ecology", "infrastructure"], {
    required_error: "Изберете категория",
  }),
  target_amount: z.number().min(100, "Минимална сума: 100 лв.").max(1000000, "Максимална сума: 1 000 000 лв."),
  deadline: z.string().optional(),
});

const CreateCampaign = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CampaignCategory | "">("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast({ variant: "destructive", title: "Максимум 5 снимки" });
      return;
    }
    const validFiles = files.filter(f => {
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

    setImages(prev => [...prev, ...validFiles]);
    validFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user) return [];
    const urls: string[] = [];
    for (const file of images) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("campaign-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("campaign-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = campaignSchema.safeParse({
      title,
      short_description: shortDesc,
      description,
      category: category || undefined,
      target_amount: Number(targetAmount),
      deadline: deadline || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      const { error } = await supabase.from("campaigns").insert({
        title: parsed.data.title,
        short_description: parsed.data.short_description,
        description: parsed.data.description,
        category: parsed.data.category,
        target_amount: parsed.data.target_amount,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline).toISOString() : null,
        images: imageUrls,
        created_by: user!.id,
        status: "pending",
      });

      if (error) throw error;

      toast({ title: "Кампанията е създадена", description: "Очаква одобрение от администратор." });
      navigate("/active");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Грешка", description: err.message || "Неуспешно създаване" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10 md:py-14">
      <h1 className="mb-2 font-heading text-3xl font-bold">Създай кампания</h1>
      <p className="mb-8 text-muted-foreground">Попълнете формата за създаване на нова дарителска кампания. Кампанията ще бъде прегледана от администратор.</p>

      <Card>
        <CardHeader>
          <CardTitle>Информация за кампанията</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Заглавие *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Напр. Ремонт на детска площадка" maxLength={200} />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Категория *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CampaignCategory)}>
                <SelectTrigger><SelectValue placeholder="Изберете категория" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>

            {/* Short description */}
            <div className="space-y-2">
              <Label htmlFor="short_desc">Кратко описание *</Label>
              <Textarea id="short_desc" value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="Кратко описание за картата на кампанията" rows={2} maxLength={300} />
              <p className="text-xs text-muted-foreground">{shortDesc.length}/300</p>
              {errors.short_description && <p className="text-sm text-destructive">{errors.short_description}</p>}
            </div>

            {/* Full description */}
            <div className="space-y-2">
              <Label htmlFor="description">Пълно описание *</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Подробно описание на кампанията, цели, план за изпълнение..." rows={6} maxLength={10000} />
              <p className="text-xs text-muted-foreground">{description.length}/10000</p>
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            {/* Target amount */}
            <div className="space-y-2">
              <Label htmlFor="target">Целева сума (лв.) *</Label>
              <Input id="target" type="number" min={100} max={1000000} value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="10000" />
              {errors.target_amount && <p className="text-sm text-destructive">{errors.target_amount}</p>}
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Краен срок (по избор)</Label>
              <Input id="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Снимки (до 5)</Label>
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                      <X className="h-3 w-3" />
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
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Създаване...</> : "Създай кампания"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCampaign;

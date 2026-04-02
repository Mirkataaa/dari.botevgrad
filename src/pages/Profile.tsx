import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Save, User, History, Lock, Upload, Megaphone, Eye, Pencil, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigate, Link } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const statusLabels: Record<string, string> = {
  active: "Активна",
  completed: "Приключена",
  pending: "Чакаща",
  rejected: "Отхвърлена",
  stopped: "Спряна",
};

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  completed: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-destructive/10 text-destructive",
  stopped: "bg-muted text-muted-foreground",
};

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useIsAdmin();
  const { data: notifications } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: donations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ["my-donations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*, campaigns:campaign_id(title)")
        .eq("donor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const canSeeOwnCampaigns = isAdmin || (profile?.is_organization && profile?.organization_verified);

  const { data: myCampaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["my-campaigns", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, title, status, current_amount, target_amount, images")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!canSeeOwnCampaigns,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Моля, изберете изображение" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Максимален размер: 2MB" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      const newUrl = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(newUrl);
      await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Снимката е качена успешно" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Грешка при качване", description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim(), avatar_url: avatarUrl })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
    } else {
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Профилът е обновен" });
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) {
      toast({ variant: "destructive", title: "Въведете текущата парола" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Новата парола трябва да е поне 6 символа" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Паролите не съвпадат" });
      return;
    }
    setChangingPw(true);
    // Verify old password by re-signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: oldPassword,
    });
    if (signInError) {
      setChangingPw(false);
      toast({ variant: "destructive", title: "Грешна текуща парола" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
    } else {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Паролата е променена успешно" });
    }
  };

  return (
    <div className="container py-10 md:py-14">
      <h1 className="font-heading text-3xl font-bold md:text-4xl">Моят профил</h1>
      <p className="mt-2 text-muted-foreground">{user.email}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Лична информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="text-lg">{(fullName || user.email || "?")[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label>Профилна снимка</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploading ? "Качване..." : "Качи снимка"}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="fullName">Име</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Телефон</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+359..." />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Запази промените
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Промяна на парола</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="oldPw">Текуща парола</Label>
              <Input id="oldPw" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPw">Нова парола</Label>
              <Input id="newPw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPw">Потвърди парола</Label>
              <Input id="confirmPw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPw || !oldPassword || !newPassword} variant="outline" className="w-full">
              {changingPw ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Промени парола
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Campaigns section */}
      {canSeeOwnCampaigns && (
        <>
          <Separator className="my-8" />
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
            <Megaphone className="h-5 w-5" /> Моите кампании
          </h2>
          {campaignsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : myCampaigns.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">Все още нямате създадени кампании.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myCampaigns.map((c: any) => {
                const pct = c.target_amount > 0 ? Math.min((Number(c.current_amount) / Number(c.target_amount)) * 100, 100) : 0;
                return (
                  <Card key={c.id} className="overflow-hidden">
                    <div className="aspect-video bg-secondary">
                      {c.images?.[0] ? (
                        <img src={c.images[0]} alt={c.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Megaphone className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-semibold line-clamp-2">{c.title}</h3>
                        <Badge className={statusColors[c.status] || "bg-muted text-muted-foreground"}>
                          {statusLabels[c.status] || c.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Number(c.current_amount)} €</span>
                          <span>{Number(c.target_amount)} €</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
                          <Link to={`/campaign/${c.id}`}>
                            <Eye className="h-3.5 w-3.5" /> Виж
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
                          <Link to={`/campaign/${c.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" /> Редактирай
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Separator className="my-8" />
      <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
        <History className="h-5 w-5" /> История на дарения
      </h2>
      {donationsLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : donations.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Все още нямате дарения.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Кампания</th>
                <th className="px-4 py-3 text-left font-medium">Сума</th>
                <th className="px-4 py-3 text-left font-medium">Дата</th>
                <th className="px-4 py-3 text-left font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {donations.map((d: any) => (
                <tr key={d.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">{(d.campaigns as any)?.title || "—"}</td>
                  <td className="px-4 py-3 font-medium">{Number(d.amount)} €</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(d.created_at).toLocaleDateString("bg-BG")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${d.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {d.status === "completed" ? "Завършено" : d.status === "pending" ? "Чакащо" : d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Profile;

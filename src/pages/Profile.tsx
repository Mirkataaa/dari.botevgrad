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
import { Loader2, Save, User, History, Lock, Upload, Megaphone, Eye, Pencil, AlertTriangle, RefreshCw, XCircle, FileEdit } from "lucide-react";
import { useMySubscriptions, useCancelSubscription } from "@/hooks/useSubscriptions";
import { useToast } from "@/hooks/use-toast";
import { Navigate, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import ProfileRevisions from "@/components/profile/ProfileRevisions";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useLanguage } from "@/contexts/LanguageContext";

const Profile = () => {
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-GB" : "bg-BG";
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useIsAdmin();
  const { data: notifications } = useNotifications();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get("tab");
  const highlightCampaignId = searchParams.get("highlight");
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
  const revisionsRef = useRef<HTMLDivElement>(null);

  const statusLabels: Record<string, string> = {
    active: t("profile.statusActive"),
    completed: t("profile.statusCompleted"),
    pending: t("profile.statusPending"),
    rejected: t("profile.statusRejected"),
    stopped: t("profile.statusStopped"),
  };

  const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary",
    completed: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-destructive/10 text-destructive",
    stopped: "bg-muted text-muted-foreground",
  };

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: donations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ["my-donations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("donations").select("*, campaigns:campaign_id(title)").eq("donor_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const canSeeOwnCampaigns = isAdmin || (profile?.is_organization && profile?.organization_verified);

  const { data: myCampaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["my-campaigns", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("id, title, status, current_amount, target_amount, images, campaign_type").eq("created_by", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!canSeeOwnCampaigns,
  });

  const { data: myPendingDrafts = [] } = useQuery({
    queryKey: ["my-pending-drafts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaign_drafts").select("campaign_id").eq("submitted_by", user!.id).eq("status", "pending_review");
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!canSeeOwnCampaigns,
  });

  const pendingDraftCampaignIds = new Set(myPendingDrafts.map((d: any) => d.campaign_id));
  const reviewNotificationsCount = (notifications?.approvedItems || 0) + (notifications?.rejectedItems || 0);

  useRealtimeSync("donations", [["my-donations", user?.id || ""]]);
  useRealtimeSync("subscriptions", [["my-subscriptions", user?.id || ""]]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  useEffect(() => {
    if (tabParam === "revisions" && revisionsRef.current) {
      setTimeout(() => { revisionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 300);
    }
  }, [tabParam]);

  if (authLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ variant: "destructive", title: t("profile.selectImage") }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ variant: "destructive", title: t("profile.maxSize") }); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const newUrl = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(newUrl);
      await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: t("profile.photoUploaded") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("profile.uploadError"), description: err.message });
    } finally { setUploading(false); }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim(), phone: phone.trim(), avatar_url: avatarUrl }).eq("id", user.id);
    setSaving(false);
    if (error) { toast({ variant: "destructive", title: t("common.error"), description: error.message }); }
    else { queryClient.invalidateQueries({ queryKey: ["profile", user.id] }); toast({ title: t("profile.profileUpdated") }); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) { toast({ variant: "destructive", title: t("profile.enterCurrentPw") }); return; }
    if (newPassword.length < 6) { toast({ variant: "destructive", title: t("profile.newPwMin") }); return; }
    if (newPassword !== confirmPassword) { toast({ variant: "destructive", title: t("profile.pwMismatch") }); return; }
    setChangingPw(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email!, password: oldPassword });
    if (signInError) { setChangingPw(false); toast({ variant: "destructive", title: t("profile.wrongCurrentPw") }); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) { toast({ variant: "destructive", title: t("common.error"), description: error.message }); }
    else { setOldPassword(""); setNewPassword(""); setConfirmPassword(""); toast({ title: t("profile.pwChanged") }); }
  };

  return (
    <div className="container py-10 md:py-14">
      <h1 className="font-heading text-3xl font-bold md:text-4xl">{t("profile.title")}</h1>
      <p className="mt-2 text-muted-foreground">{user.email}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> {t("profile.personalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="text-lg">{(fullName || user.email || "?")[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label>{t("profile.profilePhoto")}</Label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploading ? t("profile.uploading") : t("profile.uploadPhoto")}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="fullName">{t("profile.name")}</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">{t("profile.phone")}</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+359..." />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t("profile.saveChanges")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> {t("profile.changePassword")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="oldPw">{t("profile.currentPassword")}</Label>
              <Input id="oldPw" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPw">{t("profile.newPassword")}</Label>
              <Input id="newPw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPw">{t("profile.confirmPassword")}</Label>
              <Input id="confirmPw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPw || !oldPassword || !newPassword} variant="outline" className="w-full">
              {changingPw ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              {t("profile.changePasswordBtn")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {canSeeOwnCampaigns && (
        <>
          <Separator className="my-8" />
          {(notifications?.rejectedItems || 0) > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {t("profile.rejectedNotice").replace("1", String(notifications!.rejectedItems))}
              </p>
            </div>
          )}
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
            <Megaphone className="h-5 w-5" /> {t("profile.myCampaigns")}
          </h2>
          {campaignsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : myCampaigns.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">{t("profile.noCampaigns")}</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myCampaigns.map((c: any) => {
                const isRecurring = c.campaign_type === "recurring";
                const pct = !isRecurring && c.target_amount > 0 ? Math.min((Number(c.current_amount) / Number(c.target_amount)) * 100, 100) : 0;
                const isRejected = notifications?.rejectedCampaignIds?.includes(c.id);
                const hasPendingDraft = pendingDraftCampaignIds.has(c.id);
                return (
                  <Card key={c.id} className={cn("overflow-hidden transition-colors", isRejected && "ring-2 ring-destructive")}>
                    <div className="aspect-video bg-secondary">
                      {c.images?.[0] ? (
                        <img src={c.images[0]} alt={c.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground"><Megaphone className="h-8 w-8" /></div>
                      )}
                    </div>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-semibold line-clamp-2">{c.title}</h3>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={statusColors[c.status] || "bg-muted text-muted-foreground"}>
                            {statusLabels[c.status] || c.status}
                          </Badge>
                          {hasPendingDraft && <Badge variant="secondary" className="text-[10px]">{t("profile.pendingDraft")}</Badge>}
                        </div>
                      </div>
                      {isRecurring ? (
                        <p className="text-xs text-muted-foreground">{t("profile.collected")}: {Number(c.current_amount)} €</p>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{Number(c.current_amount)} €</span>
                            <span>{Number(c.target_amount)} €</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
                          <Link to={`/campaign/${c.id}`}><Eye className="h-3.5 w-3.5" /> {t("profile.view")}</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
                          <Link to={`/campaign/${c.id}/edit`}><Pencil className="h-3.5 w-3.5" /> {t("profile.edit")}</Link>
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

      {canSeeOwnCampaigns && (
        <>
          <Separator className="my-8" />
          <div ref={revisionsRef}>
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold mb-4">
              <FileEdit className="h-5 w-5" /> {t("profile.revisions")}
              {(reviewNotificationsCount + myPendingDrafts.length) > 0 && (
                <Badge variant="destructive" className="ml-2">{reviewNotificationsCount + myPendingDrafts.length}</Badge>
              )}
            </h2>
            <ProfileRevisions highlightCampaignId={highlightCampaignId} />
          </div>
        </>
      )}

      <Separator className="my-8" />
      <SubscriptionsSection />

      <Separator className="my-8" />
      <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
        <History className="h-5 w-5" /> {t("profile.donationHistory")}
      </h2>
      {donationsLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : donations.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{t("profile.noDonations")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t("profile.campaign")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("profile.amount")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("profile.date")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("profile.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {donations.map((d: any) => (
                <tr key={d.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">{(d.campaigns as any)?.title || "—"}</td>
                  <td className="px-4 py-3 font-medium">{Number(d.amount)} €</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(d.created_at).toLocaleDateString(locale)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${d.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {d.status === "completed" ? t("profile.statusCompleted") : d.status === "pending" ? t("profile.statusPending") : d.status}
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

const SubscriptionsSection = () => {
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-GB" : "bg-BG";
  const { data: subscriptions = [], isLoading } = useMySubscriptions();
  const cancelMutation = useCancelSubscription();
  const activeOrCancelling = subscriptions.filter((s) => s.status === "active" || s.status === "cancelling");

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <>
      <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
        <RefreshCw className="h-5 w-5" /> {t("profile.mySubscriptions")}
      </h2>
      {activeOrCancelling.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">{t("profile.noSubscriptions")}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {activeOrCancelling.map((sub) => (
            <Card key={sub.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="space-y-1">
                  <p className="font-medium">{Number(sub.amount)} € / {sub.interval === "month" ? t("profile.perMonth") : t("profile.perYear")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.from")} {new Date(sub.created_at).toLocaleDateString(locale)}
                    {sub.current_period_end && ` · ${t("profile.nextPayment")}: ${new Date(sub.current_period_end).toLocaleDateString(locale)} ${new Date(sub.current_period_end).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                  {sub.status === "cancelling" && (
                    <Badge variant="outline" className="text-destructive border-destructive/30">{t("profile.cancelledNote")}</Badge>
                  )}
                </div>
                {sub.status === "active" && (
                  <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => cancelMutation.mutate(sub.id)} disabled={cancelMutation.isPending}>
                    <XCircle className="h-4 w-4" /> {t("profile.cancel")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default Profile;

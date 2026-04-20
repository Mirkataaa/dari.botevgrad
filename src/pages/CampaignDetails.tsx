import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Tag, Pencil, RefreshCw, XCircle, Loader2, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CampaignProgress from "@/components/campaigns/CampaignProgress";
import CampaignComments from "@/components/campaigns/CampaignComments";
import CampaignUpdates from "@/components/campaigns/CampaignUpdates";
import CampaignImageGallery from "@/components/campaigns/CampaignImageGallery";
import CampaignDocuments from "@/components/campaigns/CampaignDocuments";
import DonateButton from "@/components/campaigns/DonateButton";
import ShareWidget from "@/components/campaigns/ShareWidget";
import { useCampaign, useDonations } from "@/hooks/useCampaigns";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useMySubscriptionForCampaign } from "@/hooks/useMySubscription";
import { useCancelSubscription } from "@/hooks/useSubscriptions";
import { markReviewNotificationsAsSeen } from "@/hooks/useNotifications";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

const categoryKeyMap: Record<string, string> = {
  social: "cat.social",
  healthcare: "cat.healthcare",
  education: "cat.education",
  culture: "cat.culture",
  ecology: "cat.ecology",
  infrastructure: "cat.infrastructure",
};

const CampaignDetails = () => {
  const { t, language } = useLanguage();
  const { id } = useParams();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: campaign, isLoading } = useCampaign(id || "");
  const { data: donations = [] } = useDonations(id);

  const isRecurring = (campaign as any)?.campaign_type === "recurring";
  const { data: mySubscription, isLoading: subLoading } = useMySubscriptionForCampaign(isRecurring ? id : undefined);
  const cancelMutation = useCancelSubscription();

  const queryClient = useQueryClient();
  const locale = language === "en" ? "en-GB" : "bg-BG";

  useRealtimeSync("campaigns", [["campaign", id || ""], ["campaigns"], ["donations", id || ""]]);
  useRealtimeSync("donations", [["campaign", id || ""], ["donations", id || ""], ["my-donations", user?.id || ""]]);
  useRealtimeSync("subscriptions", [["my-campaign-subscription", id || "", user?.id || ""], ["my-subscriptions", user?.id || ""]]);

  useEffect(() => {
    if (user && campaign && campaign.created_by === user.id && id) {
      markReviewNotificationsAsSeen(id).then(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      });
    }
  }, [user, campaign, id, queryClient]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="font-heading text-2xl font-bold">{t("details.notFound")}</h1>
        <Button asChild variant="outline">
          <Link to="/active"><ArrowLeft className="mr-2 h-4 w-4" />{t("details.backBtn")}</Link>
        </Button>
      </div>
    );
  }

  const isClosed = campaign.status === "completed" || campaign.status === "closed";
  const canEdit = user && (isAdmin || user.id === campaign.created_by);
  const images = campaign.images || [];
  const hasActiveSub = mySubscription && (mySubscription.status === "active" || mySubscription.status === "cancelling");

  // Localized content with fallback to BG
  const displayTitle =
    (language === "en" && (campaign as any).title_en) || campaign.title;
  const displayDescription =
    (language === "en" && (campaign as any).description_en) || campaign.description;

  return (
    <div className="container py-8 md:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/active"><ArrowLeft className="mr-2 h-4 w-4" />{t("details.back")}</Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <CampaignImageGallery images={images} title={displayTitle} />

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />{t(categoryKeyMap[campaign.category] || campaign.category)}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />{new Date(campaign.created_at).toLocaleDateString(locale)}
            </Badge>
            {isRecurring && (
              <Badge className="gap-1 bg-accent text-accent-foreground">
                <RefreshCw className="h-3 w-3" />{t("details.recurring")}
              </Badge>
            )}
            {isClosed && <Badge className="bg-primary text-primary-foreground">{campaign.status === "closed" ? t("details.closed") : t("details.finished")}</Badge>}
          </div>

          <h1 className="font-heading text-3xl font-bold md:text-4xl">{displayTitle}</h1>
          {canEdit && (
            <Button asChild variant="outline" size="sm" className="gap-1 mt-2 w-fit">
              <Link to={`/campaign/${campaign.id}/edit`}>
                <Pencil className="h-4 w-4" /> {t("details.edit")}
              </Link>
            </Button>
          )}
          <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">{displayDescription}</p>

          {campaign.documents && campaign.documents.length > 0 && (
            <>
              <Separator />
              <CampaignDocuments documents={campaign.documents} />
            </>
          )}

          <Separator />
          <CampaignUpdates campaignId={campaign.id} campaignCreatorId={campaign.created_by} />
          <Separator />
          <CampaignComments campaignId={campaign.id} />
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardContent className="space-y-6 p-6">
              {!isRecurring && (
                <CampaignProgress collected={Number(campaign.current_amount)} target={Number(campaign.target_amount)} size="lg" />
              )}
              {isRecurring && (
                <div className="text-center space-y-1">
                  <p className="text-2xl font-bold text-primary">{Number(campaign.current_amount)} €</p>
                  <p className="text-sm text-muted-foreground">{t("details.collectedSoFar")}</p>
                </div>
              )}

              {isRecurring && hasActiveSub ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <p className="text-sm font-semibold text-primary flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      {t("details.activeSub")}: {mySubscription.amount} €/{mySubscription.interval === "month" ? t("details.perMonth") : t("details.perYear")}
                    </p>
                    {mySubscription.current_period_end && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("details.nextPayment")}: {new Date(mySubscription.current_period_end).toLocaleDateString(locale)} {new Date(mySubscription.current_period_end).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    {mySubscription.status === "cancelling" && (
                      <p className="text-xs text-destructive">{t("details.cancelledEndOfPeriod")}</p>
                    )}
                  </div>
                  {mySubscription.status === "active" && (
                    <Button
                      variant="outline"
                      className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => cancelMutation.mutate(mySubscription.id)}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      {t("details.cancelSub")}
                    </Button>
                  )}
                  <ShareWidget campaignId={campaign.id} campaignTitle={displayTitle} campaignImage={images[0]} />
                </div>
              ) : (
                <div className="flex gap-3">
                  <DonateButton campaignId={campaign.id} campaignTitle={displayTitle} disabled={isClosed} isRecurring={isRecurring} />
                  <ShareWidget campaignId={campaign.id} campaignTitle={displayTitle} campaignImage={images[0]} />
                </div>
              )}

              <Separator />
              <div>
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {t("details.donations")} ({donations.length})
                </h3>
                {donations.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">{t("details.noDonations")}</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {donations.slice(0, 20).map((d) => (
                      <li key={d.id} className="flex items-start justify-between rounded-lg bg-secondary/60 p-3">
                        <div>
                          <p className="text-sm font-medium">{d.is_anonymous ? t("details.anonymous") : (d.donor_name || t("details.donor"))}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString(locale)}</p>
                        </div>
                        <span className="text-sm font-bold text-primary">{Number(d.amount)} €</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;

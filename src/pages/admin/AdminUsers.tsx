import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Building2 } from "lucide-react";

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    setProfiles(profilesRes.data || []);

    const rolesMap: Record<string, string[]> = {};
    (rolesRes.data || []).forEach((r: any) => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role);
    });
    setRoles(rolesMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const verifyOrganization = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ organization_verified: true })
      .eq("id", userId);

    if (error) {
      toast({ variant: "destructive", title: "Грешка", description: error.message });
    } else {
      toast({ title: "Организацията е верифицирана" });
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">Потребители</h1>

      {profiles.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Няма потребители</p>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{profile.full_name || "Без име"}</p>
                    {roles[profile.id]?.includes("admin") && (
                      <Badge className="bg-primary/10 text-primary">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Админ
                      </Badge>
                    )}
                    {profile.is_organization && (
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {profile.organization_name || "Организация"}
                        {profile.organization_verified && " ✓"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Регистриран: {new Date(profile.created_at).toLocaleDateString("bg-BG")}
                  </p>
                </div>

                <div className="flex gap-2">
                  {profile.is_organization && !profile.organization_verified && (
                    <Button size="sm" onClick={() => verifyOrganization(profile.id)}>
                      Верифицирай
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

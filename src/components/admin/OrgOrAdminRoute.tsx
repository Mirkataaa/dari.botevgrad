import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";

const OrgOrAdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [isVerifiedOrg, setIsVerifiedOrg] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) { setProfileLoading(false); return; }
      const { data } = await supabase.from("profiles").select("is_organization, organization_verified").eq("id", user.id).single();
      setIsVerifiedOrg(!!data?.is_organization && !!data?.organization_verified);
      setProfileLoading(false);
    };
    check();
  }, [user]);

  if (authLoading || roleLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin && !isVerifiedOrg) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default OrgOrAdminRoute;

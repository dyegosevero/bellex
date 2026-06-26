import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LogoDraw } from "@/components/ui/logo-draw";
import { isClinicSubdomain, isCustomDomain } from "@/App";

const isClinicDomain = isClinicSubdomain || isCustomDomain;

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, role, signOut } = useAuth();
  const [clinicCheck, setClinicCheck] = useState<"pending" | "ok" | "denied">(
    isClinicDomain ? "pending" : "ok"
  );

  useEffect(() => {
    if (!isClinicDomain || !user) return;
    // Superadmin always passes
    if (role === "admin") { setClinicCheck("ok"); return; }

    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];

    supabase
      .from("workspace_clinics")
      .select("clinic_auth_user_id")
      .or(`subdomain.eq.${subdomain},custom_domain.eq.${hostname}`)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setClinicCheck("denied"); return; }
        // No user assigned → only superadmin can enter (clinic not set up yet)
        if (!data.clinic_auth_user_id) { setClinicCheck("denied"); return; }
        setClinicCheck(data.clinic_auth_user_id === user.id ? "ok" : "denied");
      });
  }, [user, role]);

  if (loading || (isClinicDomain && clinicCheck === "pending" && user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <LogoDraw size={48} loopCount={2} drawDuration={1200} fillDuration={400} fillDelay={150} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (clinicCheck === "denied") {
    signOut();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

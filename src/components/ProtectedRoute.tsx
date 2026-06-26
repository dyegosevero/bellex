import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogoDraw } from "@/components/ui/logo-draw";
import { isClinicSubdomain, isCustomDomain } from "@/lib/domain";

const isClinicDomain = isClinicSubdomain || isCustomDomain;

function getClinicIdFromCache(): string | null {
  try {
    const cached = JSON.parse(localStorage.getItem("brand_" + window.location.hostname) ?? "null");
    return cached?.id ?? null;
  } catch { return null; }
}

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, role, signOut } = useAuth();

  // Clinic domain: if user has no clinic_id in JWT or wrong one → sign out
  const denied = !loading && !!user && isClinicDomain && role !== "admin" && (() => {
    const userClinicId: string | undefined = (user.app_metadata as Record<string, string>)?.clinic_id;
    if (!userClinicId) return true;
    const domainClinicId = getClinicIdFromCache();
    if (domainClinicId && userClinicId !== domainClinicId) return true;
    return false;
  })();

  useEffect(() => {
    if (denied) signOut();
  }, [denied]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <LogoDraw size={48} loopCount={2} drawDuration={1200} fillDuration={400} fillDelay={150} />
      </div>
    );
  }

  if (!user || denied) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

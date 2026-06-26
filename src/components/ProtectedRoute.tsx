import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogoDraw } from "@/components/ui/logo-draw";
import { isClinicSubdomain, isCustomDomain } from "@/App";

const isClinicDomain = isClinicSubdomain || isCustomDomain;

function getClinicIdFromCache(): string | null {
  try {
    const cached = JSON.parse(localStorage.getItem("brand_" + window.location.hostname) ?? "null");
    return cached?.id ?? null;
  } catch { return null; }
}

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, role, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <LogoDraw size={48} loopCount={2} drawDuration={1200} fillDuration={400} fillDelay={150} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Clinic domain: validate that user belongs to this clinic via JWT app_metadata
  if (isClinicDomain && role !== "admin") {
    const userClinicId: string | undefined = (user.app_metadata as Record<string, string>)?.clinic_id;
    const domainClinicId = getClinicIdFromCache();

    // If user has no clinic_id in JWT → not a clinic user → deny
    if (!userClinicId) {
      signOut();
      return <Navigate to="/login" replace />;
    }

    // If we have the domain's clinic_id cached, validate it matches
    if (domainClinicId && userClinicId !== domainClinicId) {
      signOut();
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isClinicSubdomain, isCustomDomain } from "@/lib/domain";

const isClinicDomain = isClinicSubdomain || isCustomDomain;

function getCachedBrand() {
  try {
    return JSON.parse(localStorage.getItem("brand_" + window.location.hostname) ?? "null");
  } catch { return null; }
}

function ClinicLoadingScreen() {
  const brand = getCachedBrand();
  const logoUrl = brand?.logo_url ? `${brand.logo_url.split("?")[0]}?download=` : null;
  const color = brand?.color ?? "#1a1a1a";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: color }}
    >
      {logoUrl
        ? <img src={logoUrl} alt="" style={{ width: 80, height: 80, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        : <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "spin 0.8s linear infinite" }} />
      }
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, role, signOut } = useAuth();
  const signingOut = useRef(false);

  // Clinic domain: if user has no clinic_id in JWT or wrong one → deny access
  const denied = !loading && !!user && isClinicDomain && role !== "admin" && (() => {
    const userClinicId: string | undefined = (user.app_metadata as Record<string, string>)?.clinic_id;
    if (!userClinicId) return true;
    const domainClinicId = getCachedBrand()?.id ?? null;
    if (domainClinicId && userClinicId !== domainClinicId) return true;
    return false;
  })();

  // Sign out in background when denied — don't block the redirect
  useEffect(() => {
    if (denied && !signingOut.current) {
      signingOut.current = true;
      signOut();
    }
  }, [denied, signOut]);

  if (loading) {
    return isClinicDomain ? <ClinicLoadingScreen /> : (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid hsl(var(--border))", borderTopColor: "hsl(var(--primary))", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || denied) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

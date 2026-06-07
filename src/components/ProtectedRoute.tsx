import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogoDraw } from "@/components/ui/logo-draw";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <LogoDraw size={48} loopCount={2} drawDuration={1200} fillDuration={400} fillDelay={150} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

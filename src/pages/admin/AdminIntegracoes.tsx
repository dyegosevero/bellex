import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import IntegrationsTab from "@/components/admin/IntegrationsTab";

export default function AdminIntegracoes() {
  const { role } = useAuth();
  const navigate = useNavigate();
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-1 text-muted-foreground" onClick={() => navigate("/admin")}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Configurações
      </Button>
      <IntegrationsTab />
    </div>
  );
}

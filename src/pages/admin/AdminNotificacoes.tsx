import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import NotificationsTab from "@/components/admin/NotificationsTab";

export default function AdminNotificacoes() {
  const { role } = useAuth();
  const navigate = useNavigate();
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/admin")}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Configurações
      </Button>
      <NotificationsTab />
    </div>
  );
}

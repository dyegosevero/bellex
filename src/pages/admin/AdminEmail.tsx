import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import EmailTab from "@/components/admin/EmailTab";

export default function AdminEmail() {
  const { role } = useAuth();
  const navigate = useNavigate();
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/admin")}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Configurações
      </Button>
      <EmailTab />
    </div>
  );
}

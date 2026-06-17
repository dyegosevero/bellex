import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BlurFade } from "@/components/ui/blur-fade";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plug } from "lucide-react";
import IntegrationsTab from "@/components/admin/IntegrationsTab";

export default function AdminIntegracoes() {
  const { role } = useAuth();
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="mb-8">
          <PageHeader icon={<Plug className="w-5 h-5" />} title="Integrações" subtitle="Conexões com serviços externos e APIs" />
        </div>
      </BlurFade>
      <IntegrationsTab />
    </div>
  );
}

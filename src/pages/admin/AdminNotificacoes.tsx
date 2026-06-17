import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BlurFade } from "@/components/ui/blur-fade";
import { PageHeader } from "@/components/ui/PageHeader";
import { Bell } from "lucide-react";
import NotificationsTab from "@/components/admin/NotificationsTab";

export default function AdminNotificacoes() {
  const { role } = useAuth();
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="mb-8">
          <PageHeader icon={<Bell className="w-5 h-5" />} title="Notificações" subtitle="Configurações de lembretes e notificações automáticas" />
        </div>
      </BlurFade>
      <NotificationsTab />
    </div>
  );
}

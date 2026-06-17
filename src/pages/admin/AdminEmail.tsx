import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BlurFade } from "@/components/ui/blur-fade";
import { PageHeader } from "@/components/ui/PageHeader";
import { Mail } from "lucide-react";
import EmailTab from "@/components/admin/EmailTab";

export default function AdminEmail() {
  const { role } = useAuth();
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="mb-8">
          <PageHeader icon={<Mail className="w-5 h-5" />} title="E-mail" subtitle="Configurações de envio de e-mails e notificações" />
        </div>
      </BlurFade>
      <EmailTab />
    </div>
  );
}

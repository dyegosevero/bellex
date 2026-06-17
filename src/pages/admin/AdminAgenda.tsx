import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BlurFade } from "@/components/ui/blur-fade";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarClock } from "lucide-react";
import AgendaTab from "@/components/admin/AgendaTab";

export default function AdminAgenda() {
  const { role } = useAuth();
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="mb-8">
          <PageHeader icon={<CalendarClock className="w-5 h-5" />} title="Agenda" subtitle="Configurações da agenda e reservas online" />
        </div>
      </BlurFade>
      <AgendaTab />
    </div>
  );
}

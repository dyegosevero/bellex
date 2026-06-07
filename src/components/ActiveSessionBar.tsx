import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtTime } from "@/lib/date";

export const ActiveSessionBar = () => {
  const { user, isSpecialist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: activeAppointment } = useQuery({
    queryKey: ["active-session-bar", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, start_time, client_id, clients!appointments_client_id_fkey(full_name)")
        .eq("specialist_id", user!.id)
        .eq("status", "em_atendimento")
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && isSpecialist,
    refetchInterval: 30_000,
  });

  if (!isSpecialist || !activeAppointment) return null;

  const isOnSessionPage = location.pathname.includes(`/atendimentos/${activeAppointment.id}/sessao`);
  if (isOnSessionPage) return null;

  const clientName = (activeAppointment.clients as any)?.full_name ?? "Cliente";

  return (
    <div className="bg-amber-500/10 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
        <p className="text-sm text-amber-800 truncate">
          <span className="font-medium">Atendimento em andamento</span>
          <span className="text-amber-600/80"> · {clientName} · {fmtTime(activeAppointment.start_time)}</span>
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-500/10"
        onClick={() => navigate(`/atendimentos/${activeAppointment.id}/sessao`)}
      >
        Voltar à sessão <ArrowRight className="w-3 h-3" />
      </Button>
    </div>
  );
};

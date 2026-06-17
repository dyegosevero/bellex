import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function useElapsed(startTime: string | null | undefined) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) { setElapsed(0); return; }
    const update = () => setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const ActiveSessionPill = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: active } = useQuery({
    queryKey: ["active-session-bar", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, start_time, clients!appointments_client_id_fkey(full_name)")
        .eq("specialist_id", user!.id)
        .eq("status", "em_atendimento")
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const elapsed = useElapsed(active?.start_time);

  const isOnSession = active && location.pathname.includes(`/atendimentos/${active.id}/sessao`);
  if (!active || isOnSession) return null;

  const clientName = (active.clients as any)?.full_name ?? "Cliente";

  return (
    <div
      className="fixed top-3 right-4 z-50 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-amber-500 text-white shadow-lg text-xs font-medium select-none"
      style={{ boxShadow: "0 2px 12px rgba(217,119,6,0.35)" }}
    >
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline truncate max-w-[120px]">{clientName}</span>
      <span className="tabular-nums font-mono">{elapsed}</span>
      <Button
        size="sm"
        className="h-6 px-2 text-[11px] bg-white/20 hover:bg-white/30 text-white border-0 rounded-full"
        onClick={() => navigate(`/atendimentos/${active.id}/sessao`)}
      >
        Encerrar <ArrowRight className="w-3 h-3 ml-0.5" />
      </Button>
    </div>
  );
};

// Keep legacy export for backwards compat (now renders nothing — pill takes over)
export const ActiveSessionBar = () => null;

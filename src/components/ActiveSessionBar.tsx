import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const location = useLocation();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: active } = useQuery({
    queryKey: ["active-session-bar", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, start_time, specialist_id, clients!appointments_client_id_fkey(full_name)")
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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["active-session-bar"] });
    queryClient.invalidateQueries({ queryKey: ["appointments-list"] });
    queryClient.invalidateQueries({ queryKey: ["agenda-calendar"] });
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
  };

  const finalize = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, user_id")
        .eq("user_id", user!.id)
        .maybeSingle();

      const payload: Record<string, unknown> = { status: "realizado" };
      if (active?.specialist_id && profile?.user_id !== active.specialist_id) {
        payload.notes = `\n\n📋 Finalizado por ${profile?.full_name ?? "usuário"}.`;
      }

      const { error } = await supabase
        .from("appointments")
        .update(payload)
        .eq("id", active!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atendimento finalizado.");
      invalidate();
    },
    onError: () => toast.error("Erro ao finalizar atendimento."),
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelado" })
        .eq("id", active!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atendimento cancelado.");
      setCancelOpen(false);
      invalidate();
    },
    onError: () => toast.error("Erro ao cancelar atendimento."),
  });

  const elapsed = useElapsed(active?.start_time);

  const isOnSession = active && location.pathname.includes(`/atendimentos/${active.id}/sessao`);
  if (!active || isOnSession) return null;

  return (
    <>
      <div
        className="fixed top-3 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white shadow-lg text-xs font-medium select-none"
        style={{ boxShadow: "0 2px 16px rgba(217,119,6,0.4)" }}
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span className="tabular-nums font-mono tracking-tight">{elapsed}</span>

        <div className="w-px h-3.5 bg-white/30 mx-0.5" />

        <Button
          size="sm"
          disabled={finalize.isPending}
          className="h-6 px-2 text-[11px] bg-white/20 hover:bg-white/30 text-white border-0 rounded-full gap-1"
          onClick={() => finalize.mutate()}
        >
          <CheckCircle2 className="w-3 h-3" />
          {finalize.isPending ? "..." : "Finalizar"}
        </Button>

        <Button
          size="sm"
          disabled={cancel.isPending}
          className="h-6 px-2 text-[11px] bg-white/10 hover:bg-red-500/60 text-white border-0 rounded-full gap-1"
          onClick={() => setCancelOpen(true)}
        >
          <XCircle className="w-3 h-3" />
          Cancelar
        </Button>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar atendimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O atendimento será marcado como cancelado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? "Cancelando..." : "Confirmar cancelamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const ActiveSessionBar = () => null;

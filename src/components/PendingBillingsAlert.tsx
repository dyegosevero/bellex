import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X, Receipt } from "lucide-react";
import { usePendingBillings, type PendingBilling } from "@/hooks/usePendingBillings";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fmtDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * Cobrança obrigatória — alerta global.
 * - Especialista: barra vermelha fixa no topo + popup ao iniciar atendimento (gerido externamente).
 * - Recepção/Admin: popup auto-abre quando há pendências; pode ser dispensado mas reabre periodicamente
 *   e em cada nova interação com a agenda (gerido externamente via hook).
 */
export function PendingBillingsAlert() {
  const { role, isSpecialist, isReceptionist, isAdmin } = useAuth();
  const { items, count } = usePendingBillings();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number>(0);

  // For recepção/admin: auto-open popup when pending exists and not recently dismissed
  useEffect(() => {
    if (count === 0) { setOpen(false); return; }
    if (!isReceptionist && !isAdmin) return;
    const since = Date.now() - dismissedAt;
    if (since > 5 * 60_000) setOpen(true); // re-prompt every 5min
  }, [count, isReceptionist, isAdmin, dismissedAt]);

  const handleResolve = (b: PendingBilling) => {
    const params = new URLSearchParams({
      appointment_id: b.appointment_id,
      client_id: b.client_id,
      client_name: b.client_name ?? "",
      appointment_date: b.start_time,
    });
    setOpen(false);
    navigate(`/cobrancas/nova?${params.toString()}`);
  };

  if (!role || count === 0) return null;

  return (
    <>
      {/* Barra vermelha flutuante — todos os papéis */}
      <div
        className="sticky top-[51px] z-40 mx-0.5 px-0.5"
        role="alert"
      >
        <div
          className={cn(
            "rounded-xl shadow-md border border-destructive/20",
            "bg-destructive text-destructive-foreground"
          )}
        >
        <div className="px-4 py-1.5 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">
            {count} {count === 1 ? "cobrança pendente" : "cobranças pendentes"}
          </span>
          <span className="opacity-90 hidden sm:inline">
            — atendimentos finalizados sem cobrança registada.
          </span>
          {!isSpecialist && (
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto h-6 text-[11px] px-2"
              onClick={() => { setDismissedAt(0); setOpen(true); }}
            >
              Resolver agora
            </Button>
          )}
          {isSpecialist && (
            <span className="ml-auto opacity-90 hidden sm:inline">
              Informe a recepção para emitir.
            </span>
          )}
        </div>
        </div>
      </div>

      {/* Popup — recepção/admin */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDismissedAt(Date.now()); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Cobranças pendentes ({count})
            </DialogTitle>
            <DialogDescription>
              Estes atendimentos terminaram e ainda não têm cobrança registada. Resolva agora para
              evitar perda de receita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto -mx-1 px-1">
            {items.map((b) => (
              <div
                key={b.appointment_id}
                className="flex items-center gap-3 p-3 rounded-md border border-border bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.client_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {b.service_name ?? "Serviço"} · {b.specialist_name ?? "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Terminou {fmtDateTime(b.end_time)}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleResolve(b)} className="gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  Cobrar
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setOpen(false); setDismissedAt(Date.now()); }}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Resolver depois
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

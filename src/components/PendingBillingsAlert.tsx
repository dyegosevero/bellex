import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { usePendingBillings } from "@/hooks/usePendingBillings";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PendingBillingsAlert() {
  const { role, isSpecialist } = useAuth();
  const { count } = usePendingBillings();
  const navigate = useNavigate();
  const [barDismissed, setBarDismissed] = useState(false);

  if (!role || count === 0 || barDismissed) return null;

  return (
    <div
      className="border border-destructive/20 bg-destructive/80 text-destructive-foreground rounded-b-xl"
      role="alert"
    >
      <div className="px-4 py-1.5 flex items-center gap-3 text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          <span className="font-semibold">
            {count} {count === 1 ? "atendimento finalizado" : "atendimentos finalizados"}
          </span>
          <span className="opacity-80 hidden sm:inline">
            {" "}sem cobrança registrada.
          </span>
        </span>
        {!isSpecialist && (
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto h-6 text-[11px] px-2 shrink-0"
            onClick={() => navigate("/cobrancas")}
          >
            Resolver agora
          </Button>
        )}
        {isSpecialist && (
          <span className="ml-auto opacity-90 hidden sm:inline">
            Informe a recepção para emitir.
          </span>
        )}
        <button
          onClick={() => setBarDismissed(true)}
          className="p-1 rounded opacity-70 hover:opacity-100 transition-opacity shrink-0"
          aria-label="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

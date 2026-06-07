import { Check, Clock, X, Circle, AlertTriangle, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType =
  | "pago" | "pendente" | "cancelado"
  | "agendado" | "em_atendimento" | "realizado" | "concluido"
  | "ativo" | "inativo"
  | "em_analise" | "bloqueado";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

const CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  cls: string;
}> = {
  pago:           { label: "Pago",           icon: Check,          cls: "bg-success/10 text-success" },
  pendente:       { label: "Pendente",       icon: Clock,          cls: "bg-warning/10 text-warning" },
  cancelado:      { label: "Cancelado",      icon: X,              cls: "bg-destructive/10 text-destructive" },
  agendado:       { label: "Agendado",       icon: Circle,         cls: "bg-primary/10 text-primary" },
  em_atendimento: { label: "Em atendimento", icon: Play,           cls: "bg-warning/10 text-warning" },
  realizado:      { label: "Realizado",      icon: Check,          cls: "bg-success/10 text-success" },
  concluido:      { label: "Concluído",      icon: Check,          cls: "bg-success/10 text-success" },
  ativo:          { label: "Ativo",          icon: Circle,         cls: "bg-primary/10 text-primary" },
  inativo:        { label: "Inativo",        icon: Circle,         cls: "bg-muted text-muted-foreground" },
  em_analise:     { label: "Em análise",     icon: Clock,          cls: "bg-info/10 text-info" },
  bloqueado:      { label: "Bloqueado",      icon: AlertTriangle,  cls: "bg-destructive/10 text-destructive" },
};

const FALLBACK = { label: "", icon: Circle, cls: "bg-muted text-muted-foreground" };

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? FALLBACK;
  const Icon = cfg.icon;
  const displayLabel = label ?? (cfg.label || status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide",
        cfg.cls,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {displayLabel}
    </span>
  );
}

import { Bell, AlertTriangle, CheckCircle2, Info, XCircle, Check, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NType = "alerta" | "sucesso" | "info" | "erro";

const NOTIFS = [
  { id: 1, type: "alerta" as NType, title: "Licença expirando em 5 dias", body: "Fernanda Lima — Pro · expira em 15/06/2025", time: "agora", read: false },
  { id: 2, type: "alerta" as NType, title: "Licença expirando em 6 dias", body: "Marcos Vieira — Starter trial · expira em 16/06/2025", time: "1h atrás", read: false },
  { id: 3, type: "erro" as NType, title: "Pagamento em atraso", body: "Ana Costa — Pro R$ 397 · venceu em 01/06/2025", time: "2h atrás", read: false },
  { id: 4, type: "sucesso" as NType, title: "Nova clínica criada", body: "Studio Bella Premium criada por Fernanda Lima", time: "ontem", read: true },
  { id: 5, type: "sucesso" as NType, title: "Pagamento confirmado", body: "Carla Mendonça — Pro R$ 397 · pago via Asaas", time: "ontem", read: true },
  { id: 6, type: "info" as NType, title: "Novo cliente cadastrado", body: "Júlio Andrade se cadastrou com plano Starter", time: "2 dias atrás", read: true },
  { id: 7, type: "sucesso" as NType, title: "Seat consumido", body: "Espaço Harmonia criado por Marcos Vieira (1/1 seats)", time: "3 dias atrás", read: true },
  { id: 8, type: "info" as NType, title: "Relatório semanal disponível", body: "Relatório da semana 22 está pronto para download", time: "5 dias atrás", read: true },
];

const typeConfig: Record<NType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  alerta: { icon: AlertTriangle, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  sucesso: { icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  info: { icon: Info, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  erro: { icon: XCircle, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

export default function WorkspaceNotificacoes() {
  const [items, setItems] = useState(NOTIFS);
  const [filter, setFilter] = useState<"todas" | "nao-lidas">("todas");

  const markAll = () => setItems(i => i.map(n => ({ ...n, read: true })));
  const markOne = (id: number) => setItems(i => i.map(n => n.id === id ? { ...n, read: true } : n));
  const remove = (id: number) => setItems(i => i.filter(n => n.id !== id));

  const filtered = filter === "nao-lidas" ? items.filter(n => !n.read) : items;
  const unread = items.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <PageHeader
          icon={<Bell className="w-5 h-5" />}
          title="Notificações"
          subtitle={unread > 0 ? `${unread} não lidas` : "Tudo em dia"}
        />
        {unread > 0 && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={markAll}>
            <Check className="w-3.5 h-3.5" />Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(["todas", "nao-lidas"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === f ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {f === "todas" ? "Todas" : `Não lidas (${unread})`}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-border/40 bg-card p-12 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação não lida</p>
          </div>
        )}
        {filtered.map(n => {
          const cfg = typeConfig[n.type];
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              className={cn(
                "rounded-xl border p-4 flex items-start gap-3 transition-all",
                n.read ? "bg-card border-border/30" : "border-border/50",
                !n.read && "shadow-sm"
              )}
              style={!n.read ? { background: cfg.bg, borderColor: cfg.border } : {}}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cfg.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm", n.read ? "font-medium text-foreground" : "font-semibold")}>{n.title}</p>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.read && (
                  <Button variant="ghost" size="icon" className="w-7 h-7" title="Marcar como lida" onClick={() => markOne(n.id)}>
                    <Check className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="w-7 h-7" title="Remover" onClick={() => remove(n.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

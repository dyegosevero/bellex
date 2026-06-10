import { useState } from "react";
import { LifeBuoy, AlertTriangle, CheckCircle2, Clock, Search, ChevronDown, Building2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TICKETS = [
  { id: "T-0041", clinic: "Clínica Estela Beauty", type: "Erro", title: "Falha ao enviar lembrete de agendamento", severity: "high", status: "aberto", time: "há 23min", detail: "Webhook de lembretes retornando 503. Resend timeout." },
  { id: "T-0040", clinic: "Studio Laser Gold", type: "Feedback", title: "Botão de cobrança duplicando registros", severity: "medium", status: "em análise", time: "há 2h", detail: "Usuário reportou clique duplo gerando 2 cobranças no mesmo atendimento." },
  { id: "T-0039", clinic: "Belle Skin Care", type: "Erro", title: "PDF de relatório com encoding errado", severity: "low", status: "resolvido", time: "há 1 dia", detail: "Caracteres especiais quebrando no PDF exportado no Firefox." },
  { id: "T-0038", clinic: "Glow Clínica", type: "Sugestão", title: "Adicionar filtro por especialista na agenda", severity: "low", status: "backlog", time: "há 3 dias", detail: "Dono da clínica sugere filtro lateral para cada profissional." },
  { id: "T-0037", clinic: "Espaço Harmonia", type: "Erro", title: "Login em loop após redefinir senha", severity: "high", status: "resolvido", time: "há 5 dias", detail: "Token de redefinição expirando antes do redirect. Corrigido no deploy 2.4.1." },
  { id: "T-0036", clinic: "Clínica Renová", type: "Feedback", title: "Não consegue acessar módulo financeiro", severity: "medium", status: "em análise", time: "há 6 dias", detail: "Plano Starter sem acesso, usuário achava que estava incluso." },
];

const SEV_STYLE: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_STYLE: Record<string, string> = {
  aberto: "bg-red-50 text-red-700 border-red-200",
  "em análise": "bg-yellow-50 text-yellow-700 border-yellow-200",
  resolvido: "bg-green-50 text-green-700 border-green-200",
  backlog: "bg-muted text-muted-foreground border-border",
};

const STATUS_ICON: Record<string, typeof AlertTriangle> = {
  aberto: AlertTriangle,
  "em análise": Clock,
  resolvido: CheckCircle2,
  backlog: Clock,
};

const TYPE_COLORS: Record<string, string> = {
  Erro: "bg-destructive/10 text-destructive",
  Feedback: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  Sugestão: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
};

export default function WorkspaceSuporte() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("todos");
  const [expanded, setExpanded] = useState<string | null>(null);

  const counts = {
    aberto: TICKETS.filter(t => t.status === "aberto").length,
    análise: TICKETS.filter(t => t.status === "em análise").length,
    resolvido: TICKETS.filter(t => t.status === "resolvido").length,
  };

  const filtered = TICKETS.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.clinic.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    const matchFilter = filter === "todos" || t.status === filter || t.type.toLowerCase() === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <PageHeader icon={<LifeBuoy className="w-5 h-5" />} title="Suporte" subtitle="Erros e feedbacks reportados pelas clínicas" />

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Abertos", value: counts.aberto, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20" },
          { label: "Em análise", value: counts.análise, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/20" },
          { label: "Resolvidos", value: counts.resolvido, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20" },
        ].map(k => (
          <div key={k.label} className={cn("rounded-xl border border-border/40 p-4 space-y-1", k.bg)}>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por clínica, ticket, título..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["todos", "aberto", "em análise", "resolvido", "erro", "feedback", "sugestão"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all capitalize",
                filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-border/80"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets list */}
      <div className="space-y-2">
        {filtered.map(t => {
          const StatusIcon = STATUS_ICON[t.status];
          const isOpen = expanded === t.id;
          return (
            <div key={t.id} className="rounded-xl border border-border/40 bg-card overflow-hidden">
              <button
                className="w-full text-left p-4 flex items-center gap-3"
                onClick={() => setExpanded(isOpen ? null : t.id)}
              >
                <StatusIcon className={cn("w-4 h-4 shrink-0", t.status === "resolvido" ? "text-green-500" : t.status === "aberto" ? "text-red-500" : "text-yellow-500")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground">{t.id}</span>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", TYPE_COLORS[t.type])}>{t.type}</span>
                    <span className="text-sm font-medium truncate">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t.clinic}</span>
                    <span className="text-xs text-muted-foreground">· {t.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SEV_STYLE[t.severity]}`}>
                    {t.severity === "high" ? "Alta" : t.severity === "medium" ? "Média" : "Baixa"}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[t.status]}`}>
                    {t.status}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-border/40 space-y-3">
                  <p className="text-sm text-muted-foreground pt-3">{t.detail}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <ExternalLink className="w-3 h-3" /> Ver clínica
                    </Button>
                    {t.status !== "resolvido" && (
                      <Button size="sm" className="gap-1.5 text-xs">
                        <CheckCircle2 className="w-3 h-3" /> Marcar resolvido
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum ticket encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

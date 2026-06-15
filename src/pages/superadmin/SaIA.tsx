import { useState } from "react";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Bot, ChevronRight, Save, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_MSG_LIMIT: Record<string, number> = { starter: 500, pro: 2000, scale: 10000 };
const IA_COST_PER_1K = 0.015; // R$ por 1k mensagens (estimativa)
const IA_KEY = "sa_ia_usage";

type IaData = Record<string, { msgs: string; tokensK: string; customLimit: string }>;

function fmtR(v: number) { return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`; }

export default function SaIA() {
  const { licenses, loading } = useWorkspaceLicenses();
  const [data, setData] = useState<IaData>(() => {
    try { return JSON.parse(localStorage.getItem(IA_KEY) ?? "{}"); } catch { return {}; }
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  const getMsgs = (id: string) => parseInt(data[id]?.msgs ?? "") || 0;
  const getTokensK = (id: string) => parseFloat(data[id]?.tokensK ?? "") || 0;
  const getLimit = (id: string, plan: string) => parseInt(data[id]?.customLimit ?? "") || PLAN_MSG_LIMIT[plan] || 500;

  const totalMsgs = licenses.reduce((s, l) => s + getMsgs(l.id), 0);
  const totalCostEst = licenses.reduce((s, l) => s + getTokensK(l.id) * IA_COST_PER_1K, 0);

  const handleSave = () => {
    try {
      localStorage.setItem(IA_KEY, JSON.stringify(data));
      toast({ title: "Dados de IA salvos." });
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader icon={<Bot className="w-5 h-5" />} title="IA & Uso" subtitle="Conversas e custo estimado de IA por tenant" />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-5">
          <p className="text-2xl font-bold">{totalMsgs.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-1">Total de mensagens este mês</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card p-5">
          <p className="text-2xl font-bold text-purple-600">{fmtR(totalCostEst)}</p>
          <p className="text-xs text-muted-foreground mt-1">Custo estimado (R$ 0,015/1k tokens)</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card p-5">
          <p className="text-2xl font-bold">{licenses.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Tenants com agentes configurados</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/30 bg-blue-50/50 p-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Insira o uso manualmente até que a integração com OpenAI/Claude Analytics esteja disponível.
          Limites padrão: Starter 500 msgs · Pro 2.000 msgs · Scale 10.000 msgs / mês.
        </p>
      </div>

      {/* Tenant list */}
      <div className="space-y-3">
        {licenses.map(l => {
          const msgs = getMsgs(l.id);
          const tokensK = getTokensK(l.id);
          const limit = getLimit(l.id, l.plan);
          const usePct = Math.min((msgs / limit) * 100, 100);
          const costEst = tokensK * IA_COST_PER_1K;
          const isExpanded = expanded === l.id;
          const barColor = usePct >= 90 ? "bg-red-500" : usePct >= 70 ? "bg-orange-400" : "bg-violet-500";

          return (
            <div key={l.id} className="rounded-2xl border border-border/40 bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : l.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700 shrink-0">
                  {l.client_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{l.client_name}</p>
                    <span className="text-xs text-muted-foreground">{costEst > 0 ? fmtR(costEst) : "—"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${usePct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {msgs.toLocaleString("pt-BR")} / {limit.toLocaleString("pt-BR")} msgs
                    </span>
                  </div>
                </div>
                <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
              </button>

              {isExpanded && (
                <div className="border-t border-border/20 p-4 space-y-4 bg-muted/10">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Mensagens recebidas (mês)</Label>
                      <Input
                        placeholder="0"
                        value={data[l.id]?.msgs ?? ""}
                        onChange={e => setData(prev => ({
                          ...prev,
                          [l.id]: { ...(prev[l.id] ?? { msgs: "", tokensK: "", customLimit: "" }), msgs: e.target.value },
                        }))}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tokens consumidos (k)</Label>
                      <Input
                        placeholder="Ex: 120.5"
                        value={data[l.id]?.tokensK ?? ""}
                        onChange={e => setData(prev => ({
                          ...prev,
                          [l.id]: { ...(prev[l.id] ?? { msgs: "", tokensK: "", customLimit: "" }), tokensK: e.target.value },
                        }))}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Limite customizado <span className="text-muted-foreground font-normal">(msgs)</span></Label>
                      <Input
                        placeholder={`Padrão: ${PLAN_MSG_LIMIT[l.plan] ?? 500}`}
                        value={data[l.id]?.customLimit ?? ""}
                        onChange={e => setData(prev => ({
                          ...prev,
                          [l.id]: { ...(prev[l.id] ?? { msgs: "", tokensK: "", customLimit: "" }), customLimit: e.target.value },
                        }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Custo estimado: <strong>{fmtR(parseFloat(data[l.id]?.tokensK ?? "0") * IA_COST_PER_1K)}</strong>
                    </p>
                    <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs">
                      <Save className="w-3.5 h-3.5" /> Salvar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {licenses.length === 0 && (
          <div className="text-center py-16">
            <Bot className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum tenant encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

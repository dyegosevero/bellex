import { useState, useMemo } from "react";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown, Save, AlertTriangle, Loader2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const PLAN_PRICE: Record<string, number> = { starter: 197, pro: 397, scale: 897 };
const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const COSTS_KEY = "sa_infra_costs";

type CostField = { key: string; label: string; hint?: string };
const COST_FIELDS: CostField[] = [
  { key: "supabase", label: "Supabase (mensal)", hint: "Pro plan ou Pay-as-you-go" },
  { key: "r2", label: "Cloudflare R2 (mensal)", hint: "Armazenamento + egress" },
  { key: "resend", label: "Resend (mensal)", hint: "E-mails transacionais" },
  { key: "meta", label: "Meta / WhatsApp (mensal)", hint: "Conversas iniciadas pelo negócio" },
  { key: "evolution", label: "EvolutionAPI / VPS (mensal)", hint: "Servidor da API WhatsApp" },
  { key: "n8n", label: "n8n (mensal)", hint: "Self-hosted ou cloud" },
  { key: "ia", label: "IA — OpenAI / Claude (mensal)", hint: "Custo total de tokens" },
  { key: "outros", label: "Outros (mensal)", hint: "DNS, monitoramento, etc." },
];

function fmtR(v: number) { return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`; }

export default function SaFinanceiro() {
  const { licenses, loading } = useWorkspaceLicenses();
  const [costs, setCosts] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(COSTS_KEY) ?? "{}"); } catch { return {}; }
  });
  const [savingCosts, setSavingCosts] = useState(false);

  const num = (k: string) => parseFloat(costs[k]?.replace(",", ".") ?? "0") || 0;
  const totalCosts = COST_FIELDS.reduce((s, f) => s + num(f.key), 0);

  const stats = useMemo(() => {
    const mrr = licenses.filter(l => l.status === "ativo").reduce((s, l) => s + (PLAN_PRICE[l.plan] ?? 0), 0);
    const margem = mrr - totalCosts;
    const margemPct = mrr > 0 ? (margem / mrr) * 100 : 0;

    const byMonth = MONTHS.map(m => ({ mes: m, mrr: 0, custo: totalCosts }));
    licenses.forEach(l => {
      const idx = new Date(l.created_at).getMonth();
      byMonth[idx].mrr += PLAN_PRICE[l.plan] ?? 0;
    });

    const byPlan = ["starter", "pro", "scale"].map(p => ({
      name: p,
      count: licenses.filter(l => l.plan === p && l.status === "ativo").length,
      mrr: licenses.filter(l => l.plan === p && l.status === "ativo").reduce((s, l) => s + (PLAN_PRICE[l.plan] ?? 0), 0),
    }));

    // CAC / LTV placeholder
    const avgTicket = mrr > 0 && licenses.filter(l => l.status === "ativo").length > 0
      ? mrr / licenses.filter(l => l.status === "ativo").length : 0;
    const ltv = avgTicket * 12; // estimated 12 month avg
    const churnRate = licenses.length > 0
      ? (licenses.filter(l => l.status === "cancelado").length / licenses.length) * 100 : 0;

    return { mrr, margem, margemPct, byMonth, byPlan, avgTicket, ltv, churnRate };
  }, [licenses, totalCosts]);

  const handleSaveCosts = () => {
    setSavingCosts(true);
    try {
      localStorage.setItem(COSTS_KEY, JSON.stringify(costs));
      toast({ title: "Custos salvos." });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally { setSavingCosts(false); }
  };

  const PLAN_COLOR: Record<string, string> = { starter: "#60a5fa", pro: "#e8957a", scale: "#a78bfa" };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<DollarSign className="w-5 h-5" />} title="Financeiro Bellex" subtitle="MRR, custos de infraestrutura, margem, CAC e LTV" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "MRR", value: fmtR(stats.mrr), icon: TrendingUp, color: "#22c55e" },
          { label: "Custos infra/mês", value: totalCosts > 0 ? fmtR(totalCosts) : "Não configurado", icon: TrendingDown, color: "#ef4444" },
          { label: "Margem bruta", value: totalCosts > 0 ? `${stats.margemPct.toFixed(1)}%` : "–", icon: DollarSign, color: "#a78bfa" },
          { label: "Ticket médio", value: stats.avgTicket > 0 ? fmtR(stats.avgTicket) : "–", icon: DollarSign, color: "#f59e0b" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}1a` }}>
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* LTV + Churn */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.ltv > 0 ? fmtR(stats.ltv) : "–"}</p>
          <p className="text-xs text-muted-foreground mt-1">LTV estimado (12 meses)</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{stats.churnRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Churn acumulado</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">
            {licenses.filter(l => l.status === "ativo").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Licenças ativas</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <p className="text-sm font-medium">MRR vs Custo por mês</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.byMonth}>
              <defs>
                <linearGradient id="gMrr2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number, name: string) => [fmtR(v), name === "mrr" ? "MRR" : "Custo"]} />
              <Area type="monotone" dataKey="mrr" stroke="#22c55e" strokeWidth={2} fill="url(#gMrr2)" />
              {totalCosts > 0 && <Area type="monotone" dataKey="custo" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#gCost)" />}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <p className="text-sm font-medium">MRR por plano</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.byPlan}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number) => [fmtR(v), "MRR"]} />
              <Bar dataKey="mrr" radius={[6, 6, 0, 0]}>
                {stats.byPlan.map(p => <Cell key={p.name} fill={PLAN_COLOR[p.name] ?? "#888"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Custos manuais */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Custos de infraestrutura</p>
            <p className="text-xs text-muted-foreground">Insira os valores mensais de cada serviço manualmente.</p>
          </div>
          {totalCosts === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" /> Não configurado
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {COST_FIELDS.map(f => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <Input
                  className="pl-8 text-sm"
                  placeholder="0,00"
                  value={costs[f.key] ?? ""}
                  onChange={e => setCosts(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div>
            <p className="text-xs text-muted-foreground">Total mensal</p>
            <p className="text-lg font-semibold">{fmtR(totalCosts)}</p>
          </div>
          <Button onClick={handleSaveCosts} disabled={savingCosts} className="gap-1.5">
            {savingCosts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar custos
          </Button>
        </div>
      </div>
    </div>
  );
}

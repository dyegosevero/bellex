import { useMemo } from "react";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { PageHeader } from "@/components/ui/PageHeader";
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const PLAN_PRICE: Record<string, number> = { starter: 500, pro: 750, scale: 1000 };
const PLAN_COLOR: Record<string, string> = { starter: "#60a5fa", pro: "#e8957a", scale: "#a78bfa" };

function fmtR(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default function SaFinanceiro() {
  const { licenses, loading } = useWorkspaceLicenses();

  const stats = useMemo(() => {
    const ativos = licenses.filter(l => l.status === "ativo");
    const mrr = ativos.reduce((s, l) => s + (PLAN_PRICE[l.plan] ?? 0), 0);
    const avgTicket = ativos.length > 0 ? mrr / ativos.length : 0;
    const ltv = avgTicket * 12;
    const churnRate = licenses.length > 0
      ? (licenses.filter(l => l.status === "cancelado").length / licenses.length) * 100
      : 0;

    const byPlan = ["starter", "pro", "scale"].map(p => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      count: ativos.filter(l => l.plan === p).length,
      mrr: ativos.filter(l => l.plan === p).reduce((s, l) => s + (PLAN_PRICE[l.plan] ?? 0), 0),
    }));

    return { mrr, avgTicket, ltv, churnRate, ativos: ativos.length, byPlan };
  }, [licenses]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<DollarSign className="w-5 h-5" />} title="Financeiro" subtitle="MRR e métricas financeiras baseadas nos workspaces ativos" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "MRR", value: fmtR(stats.mrr), icon: TrendingUp, color: "#22c55e" },
          { label: "Ticket médio", value: stats.avgTicket > 0 ? fmtR(stats.avgTicket) : "–", icon: DollarSign, color: "#f59e0b" },
          { label: "LTV estimado (12m)", value: stats.ltv > 0 ? fmtR(stats.ltv) : "–", icon: TrendingUp, color: "#a78bfa" },
          { label: "Churn acumulado", value: `${stats.churnRate.toFixed(1)}%`, icon: TrendingDown, color: "#ef4444" },
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

      {/* Resumo rápido */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.ativos}</p>
          <p className="text-xs text-muted-foreground mt-1">Workspaces ativos</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground/80">{licenses.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total de licenças</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card p-4 text-center">
          <p className="text-3xl font-bold text-red-400">
            {licenses.filter(l => l.status === "cancelado").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Cancelados</p>
        </div>
      </div>

      {/* MRR por plano */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
        <p className="text-sm font-medium">MRR por plano</p>
        {stats.byPlan.every(p => p.mrr === 0) ? (
          <p className="text-sm text-muted-foreground/70 py-8 text-center">Nenhum workspace ativo ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.byPlan} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={v => `R$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, color: "hsl(var(--foreground))", fontSize: 12 }}
                formatter={(v: number) => [fmtR(v), "MRR"]}
              />
              <Bar dataKey="mrr" radius={[6, 6, 0, 0]}>
                {stats.byPlan.map(p => <Cell key={p.name} fill={PLAN_COLOR[p.name.toLowerCase()] ?? "#888"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

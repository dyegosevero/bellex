import { useMemo } from "react";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  LayoutDashboard, TrendingUp, Users, Building2, AlertTriangle,
  DollarSign, Activity, ArrowUpRight, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const PLAN_PRICE: Record<string, number> = { starter: 197, pro: 397, scale: 897 };
const PLAN_COLOR: Record<string, string> = { starter: "#60a5fa", pro: "#e8957a", scale: "#a78bfa" };

const INFRA_COSTS = { supabase: 0, r2: 0, resend: 0, meta: 0, evolution: 0, n8n: 0, ia: 0 };

function KpiCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}1a` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend === "up" && <ArrowUpRight className="w-4 h-4 text-green-500" />}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function SaDashboard() {
  const { licenses, loading: loadingLic } = useWorkspaceLicenses();
  const { clinics, loading: loadingClin } = useWorkspaceClinics();
  const loading = loadingLic || loadingClin;

  const stats = useMemo(() => {
    const mrr = licenses.filter(l => l.status === "ativo").reduce((s, l) => s + (PLAN_PRICE[l.plan] ?? 0), 0);
    const infraTotal = Object.values(INFRA_COSTS).reduce((a, b) => a + b, 0);
    const margem = mrr - infraTotal;

    const byPlan = Object.entries(
      licenses.reduce((acc, l) => {
        acc[l.plan] = (acc[l.plan] ?? 0) + (PLAN_PRICE[l.plan] ?? 0);
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const byMonth: Record<string, number> = {};
    const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    licenses.forEach(l => {
      const m = months[new Date(l.created_at).getMonth()];
      byMonth[m] = (byMonth[m] ?? 0) + (PLAN_PRICE[l.plan] ?? 0);
    });
    const mrrChart = months.map(m => ({ mes: m, mrr: byMonth[m] ?? 0 }));

    const churn = licenses.filter(l => l.status === "cancelado" || l.status === "suspenso").length;
    const trial = licenses.filter(l => l.status === "trial").length;
    const ativos = licenses.filter(l => l.status === "ativo").length;

    return { mrr, margem, infraTotal, byPlan, mrrChart, churn, trial, ativos };
  }, [licenses]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Carregando…</span>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<LayoutDashboard className="w-5 h-5" />} title="Super Admin" subtitle="Visão consolidada da plataforma Bellex" />

      {/* Banner de aviso — custos manuais */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
        <span>Custos de infraestrutura ainda não configurados — vá em <strong>Configurações</strong> para inserir os valores manualmente.</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="MRR estimado" value={`R$ ${stats.mrr.toLocaleString("pt-BR")}`} sub="licenças ativas" color="#a78bfa" trend="up" />
        <KpiCard icon={TrendingUp} label="Margem bruta" value={stats.infraTotal === 0 ? "–" : `R$ ${stats.margem.toLocaleString("pt-BR")}`} sub={stats.infraTotal === 0 ? "Configure custos" : "MRR − infra"} color="#22c55e" />
        <KpiCard icon={Users} label="Tenants ativos" value={String(stats.ativos)} sub={`${stats.trial} em trial`} color="#3b82f6" />
        <KpiCard icon={Building2} label="Clínicas ativas" value={String(clinics.filter(c => c.status === "ativo" || c.status === "trial").length)} sub={`${clinics.length} total`} color="#f59e0b" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <div>
            <p className="text-sm font-medium">MRR por mês</p>
            <p className="text-xs text-muted-foreground">Receita estimada das novas licenças</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.mrrChart}>
              <defs>
                <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "MRR"]} />
              <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <p className="text-sm font-medium">Distribuição por plano</p>
          {stats.byPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Nenhuma licença ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={stats.byPlan} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {stats.byPlan.map((entry) => (
                    <Cell key={entry.name} fill={PLAN_COLOR[entry.name] ?? "#888"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "MRR"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["ativo", "trial", "inadimplente", "suspenso", "cancelado"] as const).map(s => {
          const cnt = licenses.filter(l => l.status === s).length;
          const colors: Record<string, string> = {
            ativo: "text-green-600", trial: "text-blue-600",
            inadimplente: "text-red-600", suspenso: "text-orange-500", cancelado: "text-muted-foreground",
          };
          return (
            <div key={s} className="rounded-xl border border-border/40 bg-card p-4 text-center">
              <p className={`text-2xl font-bold ${colors[s]}`}>{cnt}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{s}</p>
            </div>
          );
        })}
      </div>

      {/* Activity placeholder */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium">Atividade recente</p>
        </div>
        <p className="text-sm text-muted-foreground py-4 text-center">Log de eventos de tenants disponível após integração com webhooks.</p>
      </div>
    </div>
  );
}

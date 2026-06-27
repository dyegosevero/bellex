import { DollarSign, TrendingUp, TrendingDown, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
import { useWorkspacePlans } from "@/hooks/useWorkspacePlans";
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace";
import { useMemo } from "react";


const statusStyle: Record<string, string> = {
  ativo: "bg-green-50 text-green-700 border-green-200",
  inadimplente: "bg-red-50 text-red-700 border-red-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
  expirando: "bg-amber-50 text-amber-700 border-amber-200",
  suspenso: "bg-orange-50 text-orange-700 border-orange-200",
  cancelado: "bg-muted text-muted-foreground border-border",
};

function KpiCard({ label, value, sub, trend, color }: { label: string; value: string; sub: string; trend?: "up" | "down"; color: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
        {trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
        {sub}
      </p>
    </div>
  );
}

export default function WorkspaceFinanceiro() {
  const { workspace } = useCurrentWorkspace();
  const { clinics, loading } = useWorkspaceClinics();
  const { plans } = useWorkspacePlans(workspace?.id ?? undefined);

  // Apenas clínicas deste workspace
  const myClinicas = useMemo(
    () => clinics.filter(c => c.customer_id === workspace?.id),
    [clinics, workspace?.id]
  );

  // Preço por slug do plano (prioriza plano customizado do workspace sobre o global)
  const planPrice = useMemo(() =>
    Object.fromEntries(plans.map(p => [p.slug, p.price])),
  [plans]);

  const stats = useMemo(() => {
    const active = myClinicas.filter(c => c.status === "ativo");
    const trial = myClinicas.filter(c => c.status === "trial");
    const inadimplente = myClinicas.filter(c => c.status === "inadimplente");
    const mrr = active.reduce((s, c) => s + (planPrice[c.plan] ?? 0), 0);
    const riskMrr = inadimplente.reduce((s, c) => s + (planPrice[c.plan] ?? 0), 0);

    const byPlan = plans.map(p => ({
      name: p.name,
      value: active.filter(c => c.plan === p.slug).reduce((s, c) => s + (planPrice[c.plan] ?? 0), 0),
      fill: p.color ?? "#888",
      count: active.filter(c => c.plan === p.slug).length,
    })).filter(p => p.value > 0);

    const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const monthlyMrr = new Array(12).fill(0);
    active.forEach(c => {
      const m = new Date(c.created_at).getMonth();
      monthlyMrr[m] += planPrice[c.plan] ?? 0;
    });
    const mrrChart = months.map((mes, i) => ({ mes, mrr: monthlyMrr[i] }));

    return { mrr, riskMrr, active, trial, inadimplente, byPlan, mrrChart };
  }, [myClinicas, planPrice]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <PageHeader icon={<DollarSign className="w-5 h-5" />} title="Financeiro" subtitle="MRR e receita por clínica" />
        <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-4 h-4" />Exportar CSV</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="MRR (clínicas ativas)" value={`R$ ${stats.mrr.toLocaleString("pt-BR")}`} sub={`${stats.active.length} clínicas`} color="hsl(142 70% 45%)" trend="up" />
        <KpiCard label="MRR em risco" value={`R$ ${stats.riskMrr.toLocaleString("pt-BR")}`} sub={`${stats.inadimplente.length} inadimplentes`} color="hsl(0 72% 51%)" />
        <KpiCard label="Em trial" value={String(stats.trial.length)} sub="sem cobrança ativa" color="hsl(221 83% 53%)" />
        <KpiCard label="Ticket médio" value={stats.active.length ? `R$ ${Math.round(stats.mrr / stats.active.length).toLocaleString("pt-BR")}` : "—"} sub="por clínica ativa" color="hsl(271 81% 56%)" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <p className="text-sm font-medium">MRR por mês de criação</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.mrrChart}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "MRR"]} />
              <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <p className="text-sm font-medium">MRR por plano</p>
          {stats.byPlan.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem clínicas ativas</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={stats.byPlan} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {stats.byPlan.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {stats.byPlan.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                      {p.name} ({p.count})
                    </span>
                    <span className="font-medium">R$ {p.value.toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40">
          <p className="text-sm font-medium">Clínicas ({myClinicas.length})</p>
        </div>
        {loading ? (
          <p className="text-center py-8 text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Clínica</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor/mês</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {myClinicas.map((c, i) => (
                <tr key={c.id} className={`border-b border-border/20 hover:bg-muted/10 ${i % 2 ? "bg-muted/5" : ""}`}>
                  <td className="p-4 text-sm font-medium">{c.client_name || "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground">{c.name}</td>
                  <td className="p-4 text-sm capitalize">{c.plan}</td>
                  <td className="p-4 text-sm font-medium">
                    {c.status === "ativo" ? `R$ ${(planPrice[c.plan] ?? 0).toLocaleString("pt-BR")}` : "—"}
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[c.status] ?? statusStyle.cancelado}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {myClinicas.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">Nenhuma clínica cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

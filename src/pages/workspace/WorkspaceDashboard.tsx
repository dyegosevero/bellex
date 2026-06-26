import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, TrendingUp, TrendingDown, ArrowUpRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
import { useWorkspacePlans } from "@/hooks/useWorkspacePlans";
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace";
import { useMemo } from "react";

const statusColor: Record<string, string> = {
  ativo: "text-green-600 bg-green-50",
  trial: "text-blue-600 bg-blue-50",
  inadimplente: "text-red-600 bg-red-50",
  suspenso: "text-orange-600 bg-orange-50",
  cancelado: "text-muted-foreground bg-muted",
};

function KpiCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string; trend?: "up" | "down";
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}1a` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend && (
          trend === "up"
            ? <span className="flex items-center gap-1 text-xs text-green-600"><TrendingUp className="w-3 h-3" />{sub}</span>
            : <span className="flex items-center gap-1 text-xs text-red-500"><TrendingDown className="w-3 h-3" />{sub}</span>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {!trend && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function WorkspaceDashboard() {
  const navigate = useNavigate();
  const { workspace } = useCurrentWorkspace();
  const { clinics, loading } = useWorkspaceClinics();
  const { plans } = useWorkspacePlans(workspace?.id ?? undefined);

  const myClinics = useMemo(
    () => clinics.filter(c => c.customer_id === workspace?.id),
    [clinics, workspace?.id]
  );

  const planPrice = useMemo(() =>
    Object.fromEntries(plans.map(p => [p.slug, p.price])),
  [plans]);

  const stats = useMemo(() => {
    const active = myClinics.filter(c => c.status === "ativo");
    const trial = myClinics.filter(c => c.status === "trial");
    const inadimplente = myClinics.filter(c => c.status === "inadimplente");
    const mrr = active.reduce((sum, c) => sum + (planPrice[c.plan] ?? 0), 0);
    const recent = myClinics.slice(0, 5);
    return { active, trial, inadimplente, mrr, recent };
  }, [myClinics, planPrice]);

  const clinicsByMonth = useMemo(() => {
    const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const counts = new Array(12).fill(0);
    myClinics.forEach(c => { counts[new Date(c.created_at).getMonth()]++; });
    return months.map((mes, i) => ({ mes, total: counts[i] }));
  }, [myClinics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando dashboard…</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<LayoutDashboard className="w-5 h-5" />} title="Dashboard" subtitle="Visão geral do workspace" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Building2} label="Clínicas ativas" value={String(stats.active.length)} sub={`${myClinics.length} total`} color="hsl(142 70% 45%)" />
        <KpiCard icon={Building2} label="Em trial" value={String(stats.trial.length)} sub="sem cobrança" color="hsl(221 83% 53%)" />
        <KpiCard icon={TrendingUp} label="Inadimplentes" value={String(stats.inadimplente.length)} sub="em risco" color="hsl(0 72% 51%)" />
        <KpiCard icon={TrendingUp} label="MRR estimado" value={`R$ ${stats.mrr.toLocaleString("pt-BR")}`} sub="clínicas ativas" color="hsl(271 81% 56%)" trend="up" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <div>
            <p className="text-sm font-medium">Clínicas cadastradas por mês</p>
            <p className="text-xs text-muted-foreground">Crescimento no ano</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={clinicsByMonth}>
              <defs>
                <linearGradient id="colorClin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [v, "Clínicas"]} />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorClin)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Clínicas recentes</p>
            <button onClick={() => navigate("/clinicas")} className="text-xs text-primary flex items-center gap-1 hover:underline">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma clínica criada ainda.</p>
          ) : (
            <div className="space-y-1">
              {stats.recent.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c.color}22` }}>
                    <Building2 className="w-3.5 h-3.5" style={{ color: c.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.client_name}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[c.status] ?? ""}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["ativo","trial","inadimplente","suspenso","cancelado"] as const).map(s => {
          const count = myClinics.filter(c => c.status === s).length;
          return (
            <div key={s} className="rounded-xl border border-border/40 bg-card p-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{s}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

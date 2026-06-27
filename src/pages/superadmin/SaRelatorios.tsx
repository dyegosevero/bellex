import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSaWorkspaces } from "@/hooks/useSaWorkspaces";
import { useSaPlans } from "@/hooks/useSaPlans";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  FileBarChart2, Loader2, Building2, Users,
  TrendingUp, DollarSign, ChevronDown, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Clinic = {
  id: string;
  name: string;
  plan: string;
  status: string;
  customer_id: string;
  created_at: string;
};

type ClinicPlanRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  color: string | null;
  customer_id: string | null;
};

function fmtR(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}1a` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  ativo: "#22c55e", trial: "#60a5fa", inadimplente: "#ef4444",
  suspenso: "#f59e0b", cancelado: "#94a3b8", expirando: "#f97316",
};

export default function SaRelatorios() {
  const { workspaces, loading: wsLoading } = useSaWorkspaces();
  const { plans: saPlans } = useSaPlans();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicPlans, setClinicPlans] = useState<ClinicPlanRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const selectedWs = useMemo(
    () => workspaces.find(w => w.id === selectedId) ?? null,
    [workspaces, selectedId]
  );

  // Preço que o workspace paga à Bellex
  const wsPlanPrice = useMemo(() => {
    if (!selectedWs) return 0;
    return saPlans.find(p => p.slug === selectedWs.plan)?.price_monthly ?? 0;
  }, [selectedWs, saPlans]);

  useEffect(() => {
    if (!selectedId) { setClinics([]); setClinicPlans([]); return; }
    setLoadingDetail(true);
    Promise.all([
      supabase.from("workspace_clinics").select("id,name,plan,status,customer_id,created_at")
        .eq("customer_id", selectedId),
      supabase.from("clinic_plans").select("id,slug,name,price,color,customer_id")
        .or(`customer_id.eq.${selectedId},customer_id.is.null`)
        .eq("active", true),
    ]).then(([clinicRes, planRes]) => {
      if (clinicRes.data) setClinics(clinicRes.data as Clinic[]);
      if (planRes.data) setClinicPlans(planRes.data as ClinicPlanRow[]);
      setLoadingDetail(false);
    });
  }, [selectedId]);

  const planPriceMap = useMemo(
    () => Object.fromEntries(clinicPlans.map(p => [p.slug, p])),
    [clinicPlans]
  );

  const stats = useMemo(() => {
    const active = clinics.filter(c => c.status === "ativo");
    const trial = clinics.filter(c => c.status === "trial");
    const inadimplente = clinics.filter(c => c.status === "inadimplente");
    const wsMrr = active.reduce((s, c) => s + (planPriceMap[c.plan]?.price ?? 0), 0);

    const byPlan = clinicPlans.map(p => ({
      name: p.name,
      count: active.filter(c => c.plan === p.slug).length,
      mrr: active.filter(c => c.plan === p.slug).reduce((s) => s + p.price, 0),
      color: p.color ?? "#888",
    })).filter(p => p.count > 0);

    const byStatus = Object.entries(STATUS_COLOR).map(([s, color]) => ({
      name: s,
      count: clinics.filter(c => c.status === s).length,
      color,
    })).filter(s => s.count > 0);

    return { active, trial, inadimplente, wsMrr, byPlan, byStatus };
  }, [clinics, clinicPlans, planPriceMap]);

  // MRR total da Bellex (todos os workspaces ativos)
  const bellexMrr = useMemo(() => {
    return workspaces
      .filter(w => w.status === "ativo")
      .reduce((s, w) => s + (saPlans.find(p => p.slug === w.plan)?.price_monthly ?? 0), 0);
  }, [workspaces, saPlans]);

  const exportCsv = () => {
    const rows = [
      ["Clínica", "Plano", "Preço/mês", "Status", "Criado em"],
      ...clinics.map(c => [
        c.name,
        c.plan,
        fmtR(planPriceMap[c.plan]?.price ?? 0),
        c.status,
        new Date(c.created_at).toLocaleDateString("pt-BR"),
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `relatorio-${selectedWs?.client_name ?? "workspace"}.csv`;
    a.click();
  };

  if (wsLoading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        icon={<FileBarChart2 className="w-5 h-5" />}
        title="Relatórios"
        subtitle="MRR por workspace e consolidado da Bellex"
      />

      {/* KPIs globais Bellex */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="MRR Bellex"
          value={fmtR(bellexMrr)}
          sub="workspaces ativos"
          icon={TrendingUp} color="#22c55e"
        />
        <KpiCard
          label="Workspaces ativos"
          value={String(workspaces.filter(w => w.status === "ativo").length)}
          sub={`${workspaces.length} total`}
          icon={Users} color="#60a5fa"
        />
        <KpiCard
          label="Ticket médio WS"
          value={workspaces.filter(w => w.status === "ativo").length > 0
            ? fmtR(bellexMrr / workspaces.filter(w => w.status === "ativo").length)
            : "—"}
          icon={DollarSign} color="#f59e0b"
        />
        <KpiCard
          label="LTV estimado (12m)"
          value={bellexMrr > 0 ? fmtR(bellexMrr * 12) : "—"}
          icon={TrendingUp} color="#a78bfa"
        />
      </div>

      {/* Gráfico MRR por plano Bellex */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
        <p className="text-sm font-medium">MRR Bellex por plano</p>
        {saPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 py-6 text-center">Nenhum plano cadastrado.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={saPlans.map(p => ({
                name: p.name,
                mrr: workspaces.filter(w => w.status === "ativo" && w.plan === p.slug)
                  .reduce((s) => s + p.price_monthly, 0),
                color: p.color ?? "#888",
              }))}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={70} tickFormatter={v => `R$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
                formatter={(v: number) => [fmtR(v), "MRR"]}
              />
              <Bar dataKey="mrr" radius={[6, 6, 0, 0]}>
                {saPlans.map(p => <Cell key={p.slug} fill={p.color ?? "#888"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Seletor de workspace */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Financeiro por Workspace</p>
          <div className="flex items-center gap-2">
            {selectedId && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 min-w-[200px] justify-between">
                  <span className="truncate">
                    {selectedWs ? selectedWs.client_name : "Selecionar workspace…"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => setSelectedId(null)}>
                  <span className="text-muted-foreground text-sm">— Nenhum —</span>
                </DropdownMenuItem>
                {workspaces.map(ws => (
                  <DropdownMenuItem key={ws.id} onClick={() => setSelectedId(ws.id)}>
                    <div className="flex items-center justify-between w-full gap-3">
                      <span className="truncate">{ws.client_name}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize
                        ${ws.status === "ativo" ? "bg-green-500/15 text-green-500" :
                          ws.status === "trial" ? "bg-blue-500/15 text-blue-500" :
                          "bg-muted text-muted-foreground"}`}>
                        {ws.status}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {!selectedId ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground/40">
            <Building2 className="w-10 h-10" />
            <p className="text-sm">Selecione um workspace para ver o relatório</p>
          </div>
        ) : loadingDetail ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs do workspace */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                label="MRR do Workspace"
                value={fmtR(stats.wsMrr)}
                sub="clínicas ativas"
                icon={TrendingUp} color="#22c55e"
              />
              <KpiCard
                label="Clínicas ativas"
                value={String(stats.active.length)}
                sub={`${clinics.length} total`}
                icon={Building2} color="#60a5fa"
              />
              <KpiCard
                label="Em trial"
                value={String(stats.trial.length)}
                icon={Users} color="#a78bfa"
              />
              <KpiCard
                label="Inadimplentes"
                value={String(stats.inadimplente.length)}
                sub={stats.inadimplente.length > 0 ? `Risco: ${fmtR(stats.inadimplente.reduce((s, c) => s + (planPriceMap[c.plan]?.price ?? 0), 0))}` : undefined}
                icon={DollarSign} color="#ef4444"
              />
            </div>

            {/* Licença Bellex deste workspace */}
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground/70 uppercase tracking-wide">Licença Bellex (plano {selectedWs?.plan})</p>
                <p className="text-lg font-semibold mt-0.5">{fmtR(wsPlanPrice)}<span className="text-xs text-muted-foreground font-normal">/mês</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground/70">Margem estimada</p>
                <p className="text-lg font-semibold mt-0.5" style={{ color: stats.wsMrr - wsPlanPrice >= 0 ? "#22c55e" : "#ef4444" }}>
                  {fmtR(stats.wsMrr - wsPlanPrice)}
                </p>
              </div>
            </div>

            {/* Gráficos lado a lado */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* MRR por plano */}
              <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MRR por plano</p>
                {stats.byPlan.length === 0 ? (
                  <p className="text-sm text-muted-foreground/50 py-6 text-center">Sem clínicas ativas</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.byPlan} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} width={60} tickFormatter={v => `R$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number, _: string, entry: { payload: { name: string; count: number } }) => [fmtR(v), `MRR — ${entry.payload.count} clínica(s)`]}
                      />
                      <Bar dataKey="mrr" radius={[5, 5, 0, 0]}>
                        {stats.byPlan.map(p => <Cell key={p.name} fill={p.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Clínicas por status */}
              <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clínicas por status</p>
                {stats.byStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground/50 py-6 text-center">Nenhuma clínica</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={stats.byStatus}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        label={({ name, count }) => `${name} (${count})`}
                        labelLine={false}
                        fontSize={10}
                      >
                        {stats.byStatus.map(s => <Cell key={s.name} fill={s.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [v, "clínicas"]}
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Lista de clínicas */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clínicas</p>
              {clinics.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 py-4 text-center">Nenhuma clínica cadastrada</p>
              ) : (
                <div className="rounded-xl border border-border/30 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30 bg-muted/20">
                        <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Clínica</th>
                        <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Plano</th>
                        <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">Valor/mês</th>
                        <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clinics.map((c, i) => {
                        const plan = planPriceMap[c.plan];
                        return (
                          <tr key={c.id} className={`border-b border-border/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                            <td className="py-2.5 px-4 font-medium">{c.name}</td>
                            <td className="py-2.5 px-4 text-muted-foreground capitalize">
                              <span className="inline-flex items-center gap-1.5">
                                {plan?.color && <span className="w-2 h-2 rounded-full inline-block" style={{ background: plan.color }} />}
                                {plan?.name ?? c.plan}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums">
                              {plan ? fmtR(plan.price) : "—"}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-full"
                                style={{
                                  background: `${STATUS_COLOR[c.status] ?? "#888"}18`,
                                  color: STATUS_COLOR[c.status] ?? "#888",
                                }}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/20 border-t border-border/30">
                        <td colSpan={2} className="py-2.5 px-4 text-xs font-medium text-muted-foreground">MRR total (ativas)</td>
                        <td className="py-2.5 px-4 text-right font-semibold tabular-nums">{fmtR(stats.wsMrr)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

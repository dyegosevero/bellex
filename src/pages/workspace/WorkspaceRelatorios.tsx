import { BarChart3, Download, Building2, TrendingUp, Users, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { useWorkspacePlans } from "@/hooks/useWorkspacePlans";
import { useMemo } from "react";

const planColor: Record<string, string> = { starter: "#60a5fa", pro: "#e8957a", scale: "#a78bfa" };

export default function WorkspaceRelatorios() {
  const { clinics, loading: loadingClin } = useWorkspaceClinics();
  const { licenses, loading: loadingLic } = useWorkspaceLicenses();
  const { plans } = useWorkspacePlans();
  const loading = loadingClin || loadingLic;

  const planPrice = useMemo(() =>
    Object.fromEntries(plans.map(p => [p.name.toLowerCase(), p.price])),
  [plans]);

  const stats = useMemo(() => {
    const activeClinics = clinics.filter(c => c.status === "ativo" || c.status === "trial");
    const mrr = licenses.filter(l => l.status === "ativo").reduce((s, l) => s + (planPrice[l.plan] ?? 0), 0);

    // Clinics by plan (via license)
    const licMap = Object.fromEntries(licenses.map(l => [l.id, l]));
    const byPlan = ["starter", "pro", "scale"].map(p => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      valor: clinics.filter(c => {
        const lic = c.customer_id ? licMap[c.customer_id] : null;
        return lic?.plan === p;
      }).length,
      fill: planColor[p],
    }));

    // Clinics by status
    const byStatus = (["ativo","trial","inadimplente","suspenso","cancelado"] as const).map(s => ({
      name: s,
      count: clinics.filter(c => c.status === s).length,
    }));

    return { activeClinics, mrr, byPlan, byStatus };
  }, [clinics, licenses]);

  const exportCsv = () => {
    const rows = [
      ["Nome","Subdomínio","Status","Plano","Criado em"],
      ...clinics.map(c => {
        const lic = licenses.find(l => l.id === c.customer_id);
        return [c.name, c.subdomain, c.status, lic?.plan ?? "—", new Date(c.created_at).toLocaleDateString("pt-BR")];
      }),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "relatorio-clinicas.csv";
    a.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <PageHeader icon={<BarChart3 className="w-5 h-5" />} title="Relatórios" subtitle="Visão geral e por clínica" />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}><Download className="w-4 h-4" />Exportar CSV</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: "Clínicas", value: String(clinics.length), sub: `${stats.activeClinics.length} ativas`, color: "#e8957a" },
          { icon: Users, label: "Licenças", value: String(licenses.length), sub: `${licenses.filter(l=>l.status==="ativo").length} ativas`, color: "#60a5fa" },
          { icon: DollarSign, label: "MRR", value: `R$ ${stats.mrr.toLocaleString("pt-BR")}`, sub: "licenças ativas", color: "#34d399" },
          { icon: TrendingUp, label: "Seats usados", value: String(licenses.reduce((s,l)=>s+l.seats_used,0)), sub: `de ${licenses.reduce((s,l)=>s+l.seats_total,0)} total`, color: "#a78bfa" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-border/40 bg-card p-4 space-y-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${k.color}1a` }}>
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <p className="text-xl font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label} — {k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <p className="text-sm font-medium">Clínicas por plano</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.byPlan} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {stats.byPlan.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
          <p className="text-sm font-medium">Distribuição por status</p>
          <div className="space-y-2.5 pt-2">
            {stats.byStatus.map(s => {
              const pct = clinics.length ? Math.round((s.count / clinics.length) * 100) : 0;
              const colors: Record<string, string> = { ativo: "#22c55e", trial: "#3b82f6", inadimplente: "#ef4444", suspenso: "#f97316", cancelado: "#9ca3af" };
              return (
                <div key={s.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{s.name}</span>
                    <span className="font-medium">{s.count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[s.name] ?? "#9ca3af" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40">
          <p className="text-sm font-medium">Lista de clínicas</p>
        </div>
        {loading ? (
          <p className="text-center py-8 text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Clínica</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Subdomínio</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Plano</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((c, i) => {
                const lic = licenses.find(l => l.id === c.customer_id);
                return (
                  <tr key={c.id} className={`border-b border-border/20 hover:bg-muted/10 ${i % 2 ? "bg-muted/5" : ""}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md" style={{ background: `${c.color}22` }} />
                        <span className="text-sm font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">{c.subdomain}.bellex.beauty</td>
                    <td className="p-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize
                        ${c.status === "ativo" ? "bg-green-50 text-green-700 border-green-200"
                        : c.status === "trial" ? "bg-blue-50 text-blue-700 border-blue-200"
                        : c.status === "inadimplente" ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-muted text-muted-foreground border-border"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-xs text-muted-foreground capitalize">{lic?.plan ?? "—"}</td>
                    <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                );
              })}
              {clinics.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">Nenhuma clínica cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

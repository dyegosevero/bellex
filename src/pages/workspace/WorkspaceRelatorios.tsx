import { BarChart3, Download, Building2, TrendingUp, Users, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";

const CLINICS_SUMMARY = [
  { name: "Clínica Estela Beauty", users: 12, revenue: 3200, appointments: 148, nps: 9.2, plan: "Pro" },
  { name: "Studio Laser Gold", users: 8, revenue: 2450, appointments: 92, nps: 8.8, plan: "Starter" },
  { name: "Belle Skin Care", users: 5, revenue: 1890, appointments: 76, nps: 9.5, plan: "Enterprise" },
  { name: "Espaço Harmonia", users: 4, revenue: 1200, appointments: 51, nps: 8.1, plan: "Starter" },
  { name: "Glow Clínica", users: 7, revenue: 2100, appointments: 87, nps: 9.0, plan: "Pro" },
];

const revenueByClinic = CLINICS_SUMMARY.map(c => ({ name: c.name.split(" ").slice(0, 2).join(" "), valor: c.revenue }));

export default function WorkspaceRelatorios() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <PageHeader icon={<BarChart3 className="w-5 h-5" />} title="Relatórios" subtitle="Visão geral e por clínica" />
        <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-4 h-4" />Exportar CSV</Button>
      </div>

      {/* KPIs consolidados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: "Clínicas", value: "38", sub: "ativas este mês", color: "#e8957a" },
          { icon: Users, label: "Usuários", value: "214", sub: "em todas as clínicas", color: "#60a5fa" },
          { icon: DollarSign, label: "Faturamento total", value: "R$ 28.800", sub: "mês atual", color: "#34d399" },
          { icon: TrendingUp, label: "Atendimentos", value: "1.842", sub: "mês atual", color: "#a78bfa" },
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

      {/* Gráfico */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
        <p className="text-sm font-medium">Faturamento por clínica — mês atual</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueByClinic} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Faturamento"]} />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
              {revenueByClinic.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela por clínica */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40">
          <p className="text-sm font-medium">Resumo por clínica</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-muted/20">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Clínica</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Plano</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuários</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Atend.</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Faturamento</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">NPS</th>
            </tr>
          </thead>
          <tbody>
            {CLINICS_SUMMARY.map((c, i) => (
              <tr
                key={c.name}
                className={`border-t border-border/20 hover:bg-muted/10 cursor-pointer transition-colors ${active === c.name ? "bg-primary/5" : i % 2 ? "bg-muted/5" : ""}`}
                onClick={() => setActive(active === c.name ? null : c.name)}
              >
                <td className="p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.name[0]}</div>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="p-4 hidden sm:table-cell text-sm text-muted-foreground">{c.plan}</td>
                <td className="p-4 text-sm">{c.users}</td>
                <td className="p-4 hidden md:table-cell text-sm">{c.appointments}</td>
                <td className="p-4 text-sm font-medium">R$ {c.revenue.toLocaleString("pt-BR")}</td>
                <td className="p-4 hidden lg:table-cell">
                  <span className={`text-sm font-semibold ${c.nps >= 9 ? "text-green-600" : "text-amber-600"}`}>{c.nps}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

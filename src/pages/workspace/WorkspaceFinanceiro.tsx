import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Download, Filter } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const mrr = [
  { mes: "Jan", mrr: 12400, churn: 800 }, { mes: "Fev", mrr: 14800, churn: 400 },
  { mes: "Mar", mrr: 13200, churn: 1600 }, { mes: "Abr", mrr: 16500, churn: 200 },
  { mes: "Mai", mrr: 18900, churn: 600 }, { mes: "Jun", mrr: 17300, churn: 900 },
  { mes: "Jul", mrr: 21000, churn: 300 }, { mes: "Ago", mrr: 19800, churn: 1100 },
  { mes: "Set", mrr: 23400, churn: 200 }, { mes: "Out", mrr: 25100, churn: 400 },
  { mes: "Nov", mrr: 24600, churn: 700 }, { mes: "Dez", mrr: 28800, churn: 300 },
];

const byPlan = [
  { name: "Starter", value: 1576, fill: "#60a5fa" },
  { name: "Pro", value: 17468, fill: "#e8957a" },
  { name: "Enterprise", value: 9756, fill: "#a78bfa" },
];

const TRANSACTIONS = [
  { id: 1, client: "Carla Mendonça", plan: "Pro", amount: 397, status: "pago", date: "01/06/2025" },
  { id: 2, client: "Patrícia Souza", plan: "Enterprise", amount: 897, status: "pago", date: "01/06/2025" },
  { id: 3, client: "Roberto Alves", plan: "Starter", amount: 197, status: "pago", date: "02/06/2025" },
  { id: 4, client: "Ana Costa", plan: "Pro", amount: 397, status: "inadimplente", date: "01/06/2025" },
  { id: 5, client: "Fernanda Lima", plan: "Pro", amount: 794, status: "pago", date: "03/06/2025" },
  { id: 6, client: "Marcos Vieira", plan: "Starter", amount: 197, status: "trial", date: "05/06/2025" },
];

const statusStyle: Record<string, string> = {
  pago: "bg-green-50 text-green-700 border-green-200",
  inadimplente: "bg-red-50 text-red-700 border-red-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
};

function KpiCard({ label, value, sub, trend, color }: { label: string; value: string; sub: string; trend?: "up" | "down"; color: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className={`text-xs flex items-center gap-1 ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
        {trend === "up" && <TrendingUp className="w-3 h-3" />}
        {trend === "down" && <TrendingDown className="w-3 h-3" />}
        {sub}
      </p>
    </div>
  );
}

export default function WorkspaceFinanceiro() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <PageHeader icon={<DollarSign className="w-5 h-5" />} title="Financeiro" subtitle="MRR, churn, cobranças e inadimplência" />
        <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-4 h-4" />Exportar</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="MRR atual" value="R$ 28.800" sub="+14% vs mês anterior" trend="up" color="#e8957a" />
        <KpiCard label="ARR projetado" value="R$ 345.600" sub="Baseado no MRR atual" color="#a78bfa" />
        <KpiCard label="Churn mensal" value="R$ 300" sub="-62% vs mês anterior" trend="up" color="#34d399" />
        <KpiCard label="Inadimplência" value="R$ 397" sub="1 assinatura em atraso" trend="down" color="#f87171" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <p className="text-sm font-medium">MRR vs Churn</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mrr}>
              <defs>
                <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8957a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#e8957a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gChurn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
              <Area type="monotone" dataKey="mrr" name="MRR" stroke="#e8957a" strokeWidth={2} fill="url(#gMrr)" />
              <Area type="monotone" dataKey="churn" name="Churn" stroke="#f87171" strokeWidth={2} fill="url(#gChurn)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <p className="text-sm font-medium">MRR por plano</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={byPlan} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                {byPlan.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {byPlan.map(p => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.fill }} />
                <span className="flex-1 text-muted-foreground">{p.name}</span>
                <span className="font-medium">R$ {p.value.toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transações recentes */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <p className="text-sm font-medium">Cobranças recentes</p>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs"><Filter className="w-3.5 h-3.5" />Filtrar</Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-muted/20">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Cliente</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Plano</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Valor</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Data</th>
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((t, i) => (
              <tr key={t.id} className={`border-t border-border/20 hover:bg-muted/10 ${i % 2 ? "bg-muted/5" : ""}`}>
                <td className="p-3 text-sm font-medium">{t.client}</td>
                <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{t.plan}</td>
                <td className="p-3 text-sm font-medium">R$ {t.amount.toLocaleString("pt-BR")}</td>
                <td className="p-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[t.status]}`}>{t.status}</span>
                </td>
                <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

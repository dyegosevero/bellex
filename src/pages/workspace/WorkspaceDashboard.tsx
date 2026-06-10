import { LayoutDashboard, Users, Building2, Key, TrendingUp, TrendingDown, AlertTriangle, HardDrive, Wifi, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const revenueData = [
  { mes: "Jan", valor: 12400 }, { mes: "Fev", valor: 14800 }, { mes: "Mar", valor: 13200 },
  { mes: "Abr", valor: 16500 }, { mes: "Mai", valor: 18900 }, { mes: "Jun", valor: 17300 },
  { mes: "Jul", valor: 21000 }, { mes: "Ago", valor: 19800 }, { mes: "Set", valor: 23400 },
  { mes: "Out", valor: 25100 }, { mes: "Nov", valor: 24600 }, { mes: "Dez", valor: 28800 },
];

const accessData = [
  { dia: "Seg", acessos: 342 }, { dia: "Ter", acessos: 418 }, { dia: "Qua", acessos: 389 },
  { dia: "Qui", acessos: 502 }, { dia: "Sex", acessos: 461 }, { dia: "Sáb", acessos: 178 }, { dia: "Dom", acessos: 95 },
];

const topClinics = [
  { name: "Clínica Estela Beauty", users: 12, revenue: "R$ 3.200", status: "ativo" },
  { name: "Studio Laser Gold", users: 8, revenue: "R$ 2.450", status: "ativo" },
  { name: "Belle Skin Care", users: 5, revenue: "R$ 1.890", status: "ativo" },
  { name: "Espaço Harmonia", users: 4, revenue: "R$ 1.200", status: "trial" },
  { name: "Clínica Renová", users: 3, revenue: "R$ 800", status: "inadimplente" },
];

const statusColor: Record<string, string> = {
  ativo: "text-green-600 bg-green-50",
  trial: "text-blue-600 bg-blue-50",
  inadimplente: "text-red-600 bg-red-50",
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
        {!trend && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function WorkspaceDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<LayoutDashboard className="w-5 h-5" />} title="Dashboard" subtitle="Visão geral do workspace" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Building2} label="Clínicas ativas" value="38" sub="+3 este mês" color="hsl(142 70% 45%)" trend="up" />
        <KpiCard icon={Users} label="Usuários totais" value="214" sub="+18 este mês" color="hsl(221 83% 53%)" trend="up" />
        <KpiCard icon={Key} label="Licenças ativas" value="12" sub="2 expirando em breve" color="hsl(38 92% 50%)" />
        <KpiCard icon={TrendingUp} label="MRR" value="R$ 28.800" sub="+14% vs mês anterior" color="hsl(271 81% 56%)" trend="up" />
      </div>

      {/* Gráficos principais */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <div>
            <p className="text-sm font-medium">Receita mensal (MRR)</p>
            <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={45} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "MRR"]} />
              <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <div>
            <p className="text-sm font-medium">Acessos por dia</p>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={accessData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip />
              <Bar dataKey="acessos" radius={[4, 4, 0, 0]}>
                {accessData.map((_, i) => (
                  <Cell key={i} fill={i === 3 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Storage / Banda + Top Clinicas */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Storage */}
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <p className="text-sm font-medium">Infraestrutura</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 text-muted-foreground"><HardDrive className="w-3.5 h-3.5" /> Storage</span>
                <span className="font-medium">68,4 GB <span className="text-muted-foreground">/ 100 GB</span></span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: "68%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Wifi className="w-3.5 h-3.5" /> Banda este mês</span>
                <span className="font-medium">142 GB <span className="text-muted-foreground">/ 500 GB</span></span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: "28%" }} />
              </div>
            </div>
            <div className="pt-1 border-t border-border/40 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Req. DB / dia</span>
                <span className="font-medium">24.800</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Clínicas online agora</span>
                <span className="font-medium text-green-600">31</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Clínicas */}
        <div className="md:col-span-2 rounded-2xl border border-border/40 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Top clínicas</p>
            <a href="/workspace/clinicas" className="text-xs text-primary flex items-center gap-1 hover:underline">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-1">
            {topClinics.map((c) => (
              <div key={c.name} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.users} usuários</p>
                </div>
                <span className="text-sm font-medium">{c.revenue}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[c.status]}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-800">2 licenças expirando nos próximos 7 dias</p>
          <p className="text-xs text-amber-700">Studio Laser Gold (3 dias) · Espaço Harmonia (6 dias)</p>
        </div>
        <a href="/workspace/licencas" className="ml-auto text-xs font-medium text-amber-700 hover:underline whitespace-nowrap">
          Gerenciar →
        </a>
      </div>
    </div>
  );
}

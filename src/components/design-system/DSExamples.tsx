import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Bell, User, Calendar, Plus, ChevronRight, 
  BarChart3, Users, Clock, Check, AlertTriangle, 
  Heart, FileText, Settings, TrendingUp, TrendingDown
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from "recharts";

const sparkUp = [3, 4, 3, 5, 7, 6, 8, 9, 8, 11].map((v, i) => ({ i, v }));
const sparkDown = [9, 8, 10, 7, 6, 8, 5, 4, 5, 3].map((v, i) => ({ i, v }));

const MiniSparkline = ({ data, color }: { data: { i: number; v: number }[]; color: string }) => (
  <div className="w-20 h-6">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const DSExamples = () => {
  const metrics = [
    { label: "Faturamento", value: "€ 48.500", change: "+12%", up: true, icon: BarChart3 },
    { label: "Pacientes Ativos", value: "187", change: "+8", up: true, icon: Users },
    { label: "Agendamentos Hoje", value: "12", change: "3 confirmados", up: true, icon: Calendar },
    { label: "Taxa de Retorno", value: "78%", change: "-2%", up: false, icon: Heart },
  ];

  const patients = [
    { name: "Maria Silva", proc: "Harmonização Facial", specialist: "Dra. Camila", date: "15/03", value: "€ 2.500", payment: "Pago", status: "Confirmado", trend: sparkUp },
    { name: "Ana Costa", proc: "Peeling Químico", specialist: "Dr. Rafael", date: "16/03", value: "€ 800", payment: "Pendente", status: "Pendente", trend: sparkDown },
    { name: "Carla Mendes", proc: "Botox", specialist: "Dra. Camila", date: "17/03", value: "€ 1.200", payment: "Pago", status: "Confirmado", trend: sparkUp },
    { name: "Juliana Rocha", proc: "Preenchimento Labial", specialist: "Dra. Camila", date: "18/03", value: "€ 1.800", payment: "Pendente", status: "Cancelado", trend: sparkDown },
    { name: "Patricia Lima", proc: "Limpeza de Pele", specialist: "Dr. Rafael", date: "19/03", value: "€ 350", payment: "Pago", status: "Confirmado", trend: sparkUp },
  ];

  const revenueData = [
    { d: "Seg", v: 6200 }, { d: "Ter", v: 8400 }, { d: "Qua", v: 7100 },
    { d: "Qui", v: 9500 }, { d: "Sex", v: 11200 }, { d: "Sáb", v: 5800 },
  ];

  return (
    <section className="ds-section border-t border-border">
      <span className="text-xs text-primary tracking-widest uppercase font-medium">10</span>
      <h2 className="ds-section-title mt-2">Exemplos Visuais Aplicados</h2>
      <p className="ds-section-subtitle">Demonstrações de como o Design System se aplica nas telas do sistema.</p>

      {/* Dashboard */}
      <h3 className="font-heading text-xl font-medium mb-6">Dashboard</h3>
      <div className="border border-border rounded-xl overflow-hidden mb-12 bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="font-heading text-lg font-normal">Bellex System</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 w-64 h-9" placeholder="Buscar pacientes..." />
            </div>
            <button className="relative p-2 rounded-md hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Welcome */}
          <div className="mb-6">
            <h2 className="font-heading font-light">Bom dia, Dra. Camila</h2>
            <p className="text-sm text-muted-foreground">Terça-feira, 3 de março de 2026</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {metrics.map((m) => (
              <div key={m.label} className="ds-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-xs flex items-center gap-0.5 ${m.up ? "text-success" : "text-destructive"}`}>
                    {m.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {m.change}
                  </span>
                </div>
                <p className="font-heading font-light">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Chart + Upcoming */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2 ds-card p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium">Faturamento Semanal</p>
                <span className="text-xs text-muted-foreground">Última semana</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(30, 12%, 65%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(30, 12%, 65%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="hsl(30, 12%, 65%)" strokeWidth={2} fill="url(#exGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="ds-card p-4">
              <p className="text-sm font-medium mb-3">Próximos Horários</p>
              <div className="space-y-3">
                {[
                  { time: "09:00", name: "Maria Silva", proc: "Harmonização" },
                  { time: "10:30", name: "Ana Costa", proc: "Peeling" },
                  { time: "14:00", name: "Carla Mendes", proc: "Botox" },
                ].map((apt) => (
                  <div key={apt.time} className="flex items-center gap-3 text-sm">
                    <span className="text-xs font-mono text-muted-foreground w-10">{apt.time}</span>
                    <div className="w-px h-6 bg-border" />
                    <div>
                      <p className="font-medium text-xs">{apt.name}</p>
                      <p className="text-xs text-muted-foreground">{apt.proc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient List with Sparkline */}
      <h3 className="font-heading text-xl font-medium mb-6">Lista com Sparkline</h3>
      <div className="border border-border rounded-xl overflow-hidden mb-12">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Paciente</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Procedimento</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Especialista</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
              <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Pagamento</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tendência</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="p-4 text-sm font-medium">{p.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.proc}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.specialist}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.date}</td>
                <td className="p-4 text-sm font-medium text-right">{p.value}</td>
                <td className="p-4">
                  <span className={`ds-badge text-[10px] ${
                    p.payment === "Pago" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}>
                    {p.payment === "Pago" && <Check className="h-3 w-3 mr-1" />}
                    {p.payment === "Pendente" && <Clock className="h-3 w-3 mr-1" />}
                    {p.payment}
                  </span>
                </td>
                <td className="p-4">
                  <MiniSparkline data={p.trend} color={p.trend === sparkUp ? "hsl(150, 25%, 45%)" : "hsl(0, 45%, 55%)"} />
                </td>
                <td className="p-4">
                  <span className={`ds-badge ${
                    p.status === "Confirmado" ? "bg-success/10 text-success" :
                    p.status === "Pendente" ? "bg-warning/10 text-warning" :
                    "bg-destructive/10 text-destructive"
                  }`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Patient Detail */}
      <h3 className="font-heading text-xl font-medium mb-6">Tela de Cliente</h3>
      <div className="border border-border rounded-xl overflow-hidden mb-12 bg-background">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-light">Maria Silva Santos</h3>
                <p className="text-sm text-muted-foreground">Desde Jan/2024</p>
                <div className="flex gap-2 mt-2">
                  <span className="ds-badge bg-primary/10 text-primary">Ativo</span>
                  <span className="ds-badge bg-accent/10 text-accent">VIP</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" />Prontuário</Button>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />Agendamento</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="ds-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Gasto</p>
              <p className="font-heading font-light">€ 12.400</p>
            </div>
            <div className="ds-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Procedimentos</p>
              <p className="font-heading font-light">8</p>
            </div>
            <div className="ds-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Próxima Consulta</p>
              <p className="font-heading font-light">15/03</p>
            </div>
          </div>

          <h4 className="font-heading text-lg font-medium mb-3">Histórico de Procedimentos</h4>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Procedimento</th>
                  <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Especialista</th>
                  <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Produtos</th>
                  <th className="text-right p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pgto</th>
                  <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "10/02/2026", proc: "Harmonização Facial — 3/3", doc: "Dra. Camila", products: "Ácido Hialurônico", value: "€ 2.500", payment: "Pago", status: "Concluído" },
                  { date: "15/01/2026", proc: "Harmonização Facial — 2/3", doc: "Dra. Camila", products: "Ácido Hialurônico", value: "€ 2.500", payment: "Pago", status: "Concluído" },
                  { date: "20/12/2025", proc: "Harmonização Facial — 1/3", doc: "Dra. Camila", products: "Ácido Hialurônico, Creme Pós", value: "€ 2.800", payment: "Pago", status: "Concluído" },
                  { date: "05/11/2025", proc: "Limpeza de Pele", doc: "Dr. Rafael", products: "—", value: "€ 350", payment: "Pendente", status: "Concluído" },
                ].map((h, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="p-3 text-xs font-mono text-muted-foreground">{h.date}</td>
                    <td className="p-3 text-sm font-medium">{h.proc}</td>
                    <td className="p-3 text-sm text-muted-foreground">{h.doc}</td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[120px] truncate">{h.products}</td>
                    <td className="p-3 text-sm font-medium text-right">{h.value}</td>
                    <td className="p-3">
                      <span className={`ds-badge text-[10px] ${h.payment === "Pago" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {h.payment}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="ds-badge bg-success/10 text-success text-[10px]">
                        <Check className="h-3 w-3 mr-1" />{h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Example */}
      <h3 className="font-heading text-xl font-medium mb-6">Modal de Atendimento</h3>
      <div className="relative border border-border rounded-xl overflow-hidden bg-foreground/5 p-8">
        <div className="mx-auto max-w-lg bg-card rounded-xl border border-border shadow-lg p-6">
          <h4 className="font-heading text-xl font-medium mb-1">Registrar Atendimento</h4>
          <p className="text-sm text-muted-foreground mb-6">Paciente: Maria Silva Santos</p>
          
          <div className="space-y-4 mb-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Procedimento</label>
              <Input placeholder="Selecione o procedimento" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data</label>
                <Input type="date" defaultValue="2026-03-15" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Horário</label>
                <Input type="time" defaultValue="09:00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observações</label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Notas sobre o atendimento..." />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button>Salvar Atendimento</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

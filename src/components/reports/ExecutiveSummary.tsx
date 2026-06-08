import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { DateRange, useCharges, useAppointments, useClients, useInactiveClients } from "@/hooks/useReportsData";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign,
  Users, CalendarDays, Minus, Target, Clock, Percent,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, LineChart, Line, Tooltip,
} from "recharts";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

interface Props { dateRange: DateRange }

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(40, 20%, 99%)",
  border: "1px solid hsl(30, 15%, 88%)",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 4px 12px hsl(30 12% 65% / 0.1)",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function MiniSparkline({ data, color }: { data: { i: number; v: number }[]; color: string }) {
  return (
    <div className="w-16 h-8 ml-auto">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive animationDuration={600} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ExecutiveSummary({ dateRange }: Props) {
  const { data: charges, isLoading } = useCharges(dateRange);
  const { data: appointments } = useAppointments(dateRange);
  const { data: clients } = useClients(dateRange);
  const { data: inactive } = useInactiveClients();

  const prevRange: DateRange = useMemo(() => {
    const diff = dateRange.to.getTime() - dateRange.from.getTime();
    return { from: new Date(dateRange.from.getTime() - diff), to: new Date(dateRange.from.getTime()) };
  }, [dateRange]);

  const { data: prevCharges } = useCharges(prevRange);
  const { data: prevAppointments } = useAppointments(prevRange);

  const kpis = useMemo(() => {
    const paid = charges?.filter((c) => c.status === "pago") ?? [];
    const revenue = paid.reduce((s, c) => s + Number(c.amount), 0);
    const prevPaid = prevCharges?.filter((c) => c.status === "pago") ?? [];
    const prevRevenue = prevPaid.reduce((s, c) => s + Number(c.amount), 0);
    const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    const apptCount = appointments?.length || 0;
    const prevApptCount = prevAppointments?.length || 0;
    const apptChange = prevApptCount > 0 ? ((apptCount - prevApptCount) / prevApptCount) * 100 : 0;

    const pending = charges?.filter((c) => c.status === "pendente").reduce((s, c) => s + Number(c.amount), 0) || 0;
    const avgTicket = paid.length ? revenue / paid.length : 0;

    const completed = appointments?.filter((a) => a.status === "realizado" || a.status === "concluido").length || 0;
    const completionRate = apptCount > 0 ? (completed / apptCount) * 100 : 0;

    return { revenue, revenueChange, apptCount, apptChange, pending, avgTicket, completionRate };
  }, [charges, prevCharges, appointments, prevAppointments]);

  // Monthly revenue for area chart
  const monthlyRevenue = useMemo(() => {
    if (!charges) return [];
    const map = new Map<string, number>();
    charges.filter((c) => c.status === "pago" && c.paid_at).forEach((c) => {
      const key = format(parseISO(c.paid_at!), "yyyy-MM");
      map.set(key, (map.get(key) || 0) + Number(c.amount));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({
        month: format(parseISO(month + "-01"), "MMM", { locale: pt }),
        value,
      }));
  }, [charges]);

  // Appointments by status for bar chart
  const byStatus = useMemo(() => {
    if (!appointments) return [];
    const map: Record<string, number> = {};
    appointments.forEach((a) => {
      const status = a.status === "concluido" ? "Concluído" : a.status === "realizado" ? "Realizado" : a.status === "cancelado" ? "Cancelado" : a.status === "agendado" ? "Agendado" : "Em atendimento";
      map[status] = (map[status] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [appointments]);

  const alerts = useMemo(() => {
    const list: { type: "warning" | "success" | "info"; message: string }[] = [];
    if (kpis.revenueChange < -10) list.push({ type: "warning", message: `Receita caiu ${Math.abs(kpis.revenueChange).toFixed(0)}% vs período anterior` });
    else if (kpis.revenueChange > 10) list.push({ type: "success", message: `Receita cresceu ${kpis.revenueChange.toFixed(0)}% vs período anterior` });
    if (kpis.pending > 0) list.push({ type: "warning", message: `${fmt(kpis.pending)} em cobranças pendentes` });
    const inactive90 = inactive?.filter((c) => c.days_inactive >= 90).length || 0;
    if (inactive90 > 0) list.push({ type: "warning", message: `${inactive90} cliente(s) inativo(s) há mais de 90 dias` });
    if (kpis.apptChange > 10) list.push({ type: "success", message: `Atendimentos cresceram ${kpis.apptChange.toFixed(0)}%` });
    else if (kpis.apptChange < -10) list.push({ type: "warning", message: `Atendimentos caíram ${Math.abs(kpis.apptChange).toFixed(0)}%` });
    if (list.length === 0) list.push({ type: "info", message: "Nenhum alerta crítico — tudo dentro do esperado" });
    return list;
  }, [kpis, inactive]);

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  function TrendBadge({ change }: { change: number }) {
    const isUp = change > 2;
    const isDown = change < -2;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isUp ? "text-[hsl(var(--success))]" : isDown ? "text-destructive" : "text-muted-foreground"}`}>
        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
        {change > 0 ? "+" : ""}{change.toFixed(1)}%
      </span>
    );
  }

  // Generate sparkline data from trend
  const revenueSparkData = monthlyRevenue.map((d, i) => ({ i, v: d.value }));
  const revenueTrend = kpis.revenueChange >= 0 ? "hsl(150, 25%, 45%)" : "hsl(0, 45%, 55%)";

  return (
    <div className="space-y-6 print:space-y-4">
      {/* KPI Cards with sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Receita</span>
            </div>
            <TrendBadge change={kpis.revenueChange} />
          </div>
          <p className="text-2xl font-semibold tracking-tight">{fmt(kpis.revenue)}</p>
          {revenueSparkData.length > 1 && <MiniSparkline data={revenueSparkData} color={revenueTrend} />}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Atendimentos</span>
            </div>
            <TrendBadge change={kpis.apptChange} />
          </div>
          <p className="text-2xl font-semibold tracking-tight">{kpis.apptCount}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Ticket Médio</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight">{fmt(kpis.avgTicket)}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Clientes</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight">{clients?.length || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">{inactive?.length || 0} inativo(s)</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Percent className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Taxa Conclusão</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight">{kpis.completionRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">atendimentos concluídos</p>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Revenue Area Chart */}
        {monthlyRevenue.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-4">Evolução de Receita</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="summaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(30, 12%, 65%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(30, 12%, 65%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="value" stroke="hsl(30, 12%, 65%)" strokeWidth={2} fill="url(#summaryGrad)" animationDuration={1200} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Appointments by status */}
        {byStatus.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-4">Atendimentos por Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="hsl(36, 40%, 62%)" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Alerts */}
      <Card className="p-5">
        <h3 className="text-sm font-medium mb-4">Destaques e Alertas</h3>
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              {alert.type === "warning" && <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))] shrink-0 mt-0.5" />}
              {alert.type === "success" && <CheckCircle className="w-4 h-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />}
              {alert.type === "info" && <CheckCircle className="w-4 h-4 text-[hsl(var(--info))] shrink-0 mt-0.5" />}
              <span className="text-muted-foreground">{alert.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

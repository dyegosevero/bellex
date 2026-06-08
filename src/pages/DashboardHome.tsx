import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardKPIs, useRevenuePerSpecialist } from "@/hooks/useDashboardData";
import { fmtCurrency } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import {
  Calendar, Users, DollarSign, TrendingUp,
  AlertCircle, BarChart3, ChevronRight, UserX,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Period selector ───────────────────────────── */
type Period = "7d" | "30d" | "90d" | "12m";

function periodLabel(p: Period) {
  return { "7d": "Últimos 7 dias", "30d": "Últimos 30 dias", "90d": "Últimos 90 dias", "12m": "Últimos 12 meses" }[p];
}

function periodRange(p: Period): { from: Date; to: Date } {
  const to = endOfDay(new Date());
  if (p === "7d")  return { from: startOfDay(subDays(to, 6)), to };
  if (p === "30d") return { from: startOfDay(subDays(to, 29)), to };
  if (p === "90d") return { from: startOfDay(subDays(to, 89)), to };
  return { from: startOfMonth(subMonths(to, 11)), to };
}

/* ── Hooks ─────────────────────────────────────── */
function useAppointmentsByPeriod(period: Period) {
  const { from, to } = periodRange(period);
  return useQuery({
    queryKey: ["appts-by-period", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("start_time, status")
        .gte("start_time", from.toISOString())
        .lte("start_time", to.toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useServicesByPeriod(period: Period) {
  const { from, to } = periodRange(period);
  return useQuery({
    queryKey: ["services-by-period", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("services(name)")
        .gte("start_time", from.toISOString())
        .lte("start_time", to.toISOString())
        .in("status", ["realizado", "concluido"]);
      if (error) throw error;
      return (data ?? []) as { services: { name: string } | null }[];
    },
  });
}

function useRevenueSeries(period: Period) {
  const { from, to } = periodRange(period);
  return useQuery({
    queryKey: ["revenue-series", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charges")
        .select("paid_at, amount")
        .gte("paid_at", from.toISOString())
        .lte("paid_at", to.toISOString())
        .eq("status", "paid");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useTodayAppointments() {
  return useQuery({
    queryKey: ["today-appts"],
    queryFn: async () => {
      const today = new Date();
      const { data } = await supabase
        .from("appointments")
        .select("id, start_time, status, specialist_id, clients!appointments_client_id_fkey(full_name), services(name)")
        .gte("start_time", startOfDay(today).toISOString())
        .lte("start_time", endOfDay(today).toISOString())
        .neq("status", "cancelado")
        .order("start_time");
      const specialistIds = [...new Set((data ?? []).map((a: any) => a.specialist_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (specialistIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", specialistIds);
        (profiles ?? []).forEach((p: any) => { profileMap[p.user_id] = p.full_name; });
      }
      return (data ?? []).map((a: any) => ({ ...a, specialist_name: profileMap[a.specialist_id] ?? null }));
    },
  });
}

/* ── Small components ──────────────────────────── */
function PeriodSelect({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as Period)}>
      <SelectTrigger className="h-8 text-xs w-40 border-border/60">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">Últimos 7 dias</SelectItem>
        <SelectItem value="30d">Últimos 30 dias</SelectItem>
        <SelectItem value="90d">Últimos 90 dias</SelectItem>
        <SelectItem value="12m">Últimos 12 meses</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SectionLink({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-1 text-xs text-primary hover:underline"
    >
      {label} <ChevronRight size={11} />
    </button>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, color, to,
}: { icon: React.ElementType; label: string; value: string; sub?: string; color: string; to?: string }) {
  const navigate = useNavigate();
  return (
    <div
      className="rounded-2xl border border-border/40 bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow"
      onClick={to ? () => navigate(to) : undefined}
      style={{ cursor: to ? "pointer" : "default" }}
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}1a` }}>
          <Icon size={16} style={{ color }} />
        </div>
        {to && <ChevronRight size={13} className="text-muted-foreground/40" />}
      </div>
      <div>
        <p className="text-2xl font-light text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-primary mt-1">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Build chart data ──────────────────────────── */
function buildRevenueSeries(rawCharges: { paid_at: string; amount: number }[], period: Period) {
  const { from, to } = periodRange(period);
  const isMonthly = period === "12m";

  if (isMonthly) {
    const months: Record<string, number> = {};
    let cur = startOfMonth(from);
    while (cur <= to) {
      months[format(cur, "MMM/yy", { locale: ptBR })] = 0;
      cur = startOfMonth(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
    }
    rawCharges.forEach(c => {
      const key = format(new Date(c.paid_at), "MMM/yy", { locale: ptBR });
      if (key in months) months[key] += c.amount;
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }

  const days = eachDayOfInterval({ start: from, end: to });
  const map: Record<string, number> = {};
  days.forEach(d => { map[format(d, "dd/MM")] = 0; });
  rawCharges.forEach(c => {
    const key = format(new Date(c.paid_at), "dd/MM");
    if (key in map) map[key] += c.amount;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function buildApptSeries(rawAppts: { start_time: string }[], period: Period) {
  const { from, to } = periodRange(period);
  const isMonthly = period === "12m";

  if (isMonthly) {
    const months: Record<string, number> = {};
    let cur = startOfMonth(from);
    while (cur <= to) {
      months[format(cur, "MMM/yy", { locale: ptBR })] = 0;
      cur = startOfMonth(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
    }
    rawAppts.forEach(a => {
      const key = format(new Date(a.start_time), "MMM/yy", { locale: ptBR });
      if (key in months) months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }

  const days = eachDayOfInterval({ start: from, end: to });
  const map: Record<string, number> = {};
  days.forEach(d => { map[format(d, "dd/MM")] = 0; });
  rawAppts.forEach(a => {
    const key = format(new Date(a.start_time), "dd/MM");
    if (key in map) map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

/* ── Main page ─────────────────────────────────── */
export default function DashboardHome() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("30d");

  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: specialists } = useRevenuePerSpecialist();
  const { data: rawCharges = [] } = useRevenueSeries(period);
  const { data: rawAppts = [] } = useAppointmentsByPeriod(period);
  const { data: todayAppts = [] } = useTodayAppointments();
  const { data: rawServices = [] } = useServicesByPeriod(period);

  const revenueSeries = buildRevenueSeries(rawCharges as { paid_at: string; amount: number }[], period);

  // Filter cancelled out for chart/counts, but keep for no-show calc
  const doneAppts = (rawAppts as { start_time: string; status: string }[]).filter(
    a => a.status !== "cancelado"
  );
  const cancelledAppts = (rawAppts as { status: string }[]).filter(a => a.status === "cancelado");
  const apptSeries = buildApptSeries(doneAppts, period);

  const totalRevenuePeriod = rawCharges.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);
  const totalApptsPeriod = doneAppts.length;

  // No-show rate: cancelled / (done + cancelled)
  const totalWithCancelled = rawAppts.length;
  const noShowRate = totalWithCancelled > 0
    ? Math.round((cancelledAppts.length / totalWithCancelled) * 100)
    : 0;

  // Top services
  const serviceCounts: Record<string, number> = {};
  (rawServices as { services: { name: string } | null }[]).forEach(r => {
    const name = r.services?.name;
    if (name) serviceCounts[name] = (serviceCounts[name] ?? 0) + 1;
  });
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + "…" : name, value }));

  const COLORS = ["hsl(10 75% 65%)", "hsl(210 80% 60%)", "hsl(142 70% 45%)", "hsl(30 90% 55%)", "hsl(262 80% 60%)"];

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground normal-case tracking-normal">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral da clínica</p>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpisLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <KpiCard
              icon={DollarSign} label="Faturamento do mês" color="hsl(142 70% 45%)"
              value={fmtCurrency(kpis?.monthly_revenue ?? 0)}
              sub={`${periodLabel(period)}: ${fmtCurrency(totalRevenuePeriod)}`}
              to="/faturamento"
            />
            <KpiCard
              icon={Calendar} label="Atendimentos do mês" color="hsl(10 75% 65%)"
              value={String(kpis?.monthly_appointments ?? 0)}
              sub={`${periodLabel(period)}: ${totalApptsPeriod}`}
              to="/dashboard"
            />
            <KpiCard
              icon={Users} label="Clientes ativos" color="hsl(210 80% 60%)"
              value={String(kpis?.active_clients ?? 0)}
              sub={`${kpis?.total_clients ?? 0} total`}
              to="/clientes"
            />
            <KpiCard
              icon={TrendingUp} label="Ticket médio" color="hsl(262 80% 60%)"
              value={fmtCurrency(kpis?.avg_ticket ?? 0)}
              to="/faturamento"
            />
            <KpiCard
              icon={UserX} label="Taxa de não comparecimento" color="hsl(0 70% 55%)"
              value={`${noShowRate}%`}
              sub={`${cancelledAppts.length} cancelamento${cancelledAppts.length !== 1 ? "s" : ""} no período`}
              to="/dashboard"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Revenue chart */}
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Faturamento</p>
              <p className="text-xs text-muted-foreground">{periodLabel(period)}</p>
            </div>
            <SectionLink to="/faturamento" label="Ver faturamento" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueSeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(10 75% 65%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(10 75% 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [fmtCurrency(v), "Faturamento"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="value" stroke="hsl(10 75% 65%)" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Appointments chart */}
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Atendimentos</p>
              <p className="text-xs text-muted-foreground">{periodLabel(period)}</p>
            </div>
            <SectionLink to="/dashboard" label="Ver agenda" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={apptSeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [v, "Atendimentos"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(10 75% 65%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Today's appointments */}
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Agenda de hoje</p>
              <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
            </div>
            <SectionLink to="/dashboard" label="Abrir agenda" />
          </div>
          {todayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <Calendar size={24} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum atendimento hoje</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(todayAppts as any[]).map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-xs text-muted-foreground w-10 shrink-0">
                    {format(new Date(a.start_time), "HH:mm")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{a.clients?.full_name ?? "—"}</p>
                    {(a.specialist_name || a.services?.name) && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[a.services?.name, a.specialist_name].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    a.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    a.status === "confirmed" ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {a.status === "completed" ? "Feito" : a.status === "confirmed" ? "Confirmado" : "Agendado"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue per specialist */}
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Por especialista</p>
              <p className="text-xs text-muted-foreground">Faturamento total</p>
            </div>
            <SectionLink to="/relatorios" label="Ver relatórios" />
          </div>
          {!specialists || specialists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <BarChart3 size={24} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {specialists.slice(0, 5).map((s, i) => {
                const max = specialists[0].total_revenue;
                const pct = max > 0 ? (s.total_revenue / max) * 100 : 0;
                return (
                  <div key={s.specialist_id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground font-medium truncate max-w-[60%]">{s.specialist_name}</span>
                      <span className="text-muted-foreground">{fmtCurrency(s.total_revenue)} · {s.appointment_count} atend.</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full">
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top procedures chart */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Procedimentos realizados</p>
            <p className="text-xs text-muted-foreground">{periodLabel(period)} · top {topServices.length}</p>
          </div>
          <SectionLink to="/relatorios" label="Ver relatórios" />
        </div>
        {topServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <BarChart3 size={24} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sem dados no período</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, topServices.length * 36)}>
            <BarChart
              data={topServices}
              layout="vertical"
              margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <Tooltip
                formatter={(v: number) => [v, "Atendimentos"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {topServices.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={1 - i * 0.07}
                  />
                ))}
                <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Inactive alert */}
      {kpis && kpis.inactive_clients > 0 && (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3 cursor-pointer hover:bg-amber-100/60 transition-colors"
          onClick={() => navigate("/clientes?tab=inativos")}
        >
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <strong>{kpis.inactive_clients} clientes</strong> sem retorno. Envie uma campanha de reativação.
          </p>
          <button className="text-xs text-amber-700 font-medium flex items-center gap-1 hover:underline">
            Ver clientes <ChevronRight size={11} />
          </button>
        </div>
      )}

    </div>
  );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BlurFade } from "@/components/ui/blur-fade";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Download, FileSpreadsheet, Printer, Users, UserX, DollarSign, TrendingUp, Receipt, BarChart3, Calendar as CalendarIcon2, Clock, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "@/hooks/useReportsData";
import { exportToPdf, exportMultiSheetXls } from "@/lib/export-utils";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardKPIs, useLastVisits, useInactiveClients, useRevenuePerSpecialist } from "@/hooks/useDashboardData";
import { fmtCurrency, fmtDate } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis } from "recharts";

import FinancialReport from "@/components/reports/FinancialReport";
import ClientsReport from "@/components/reports/ClientsReport";
import AppointmentsReport from "@/components/reports/AppointmentsReport";
import ProductsReport from "@/components/reports/ProductsReport";
import SpecialistsReport from "@/components/reports/SpecialistsReport";
import ExecutiveSummary from "@/components/reports/ExecutiveSummary";

type Period = "7d" | "30d" | "90d" | "12m" | "custom";

function DashboardOverview({ dateRange }: { dateRange: DateRange }) {
  const navigate = useNavigate();
  const fromIso = dateRange.from.toISOString();
  const toIso = dateRange.to.toISOString();

  // Appointments in range
  const { data: rangeAppointments, isLoading: kpisLoading } = useQuery({
    queryKey: ["report-appointments", fromIso, toIso],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, client_id, specialist_id, start_time, status")
        .gte("start_time", fromIso)
        .lte("start_time", toIso);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Charges in range
  const { data: rangeCharges } = useQuery({
    queryKey: ["report-charges", fromIso, toIso],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charges")
        .select("id, amount, status, paid_at, client_id")
        .gte("created_at", fromIso)
        .lte("created_at", toIso);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: totalClientsCount } = useQuery({
    queryKey: ["report-total-clients"],
    queryFn: async () => {
      const { count, error } = await supabase.from("clients").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Compute KPIs from range data
  const kpis = useMemo(() => {
    if (!rangeAppointments || !rangeCharges || totalClientsCount == null) return null;
    const paidCharges = rangeCharges.filter(c => c.status === "pago");
    const totalRevenue = paidCharges.reduce((s, c) => s + Number(c.amount), 0);
    const avgTicket = paidCharges.length > 0 ? totalRevenue / paidCharges.length : 0;
    const activeClientIds = new Set(rangeAppointments.map(a => a.client_id));
    return {
      active_clients: activeClientIds.size,
      inactive_clients: totalClientsCount - activeClientIds.size,
      total_revenue: totalRevenue,
      monthly_revenue: totalRevenue,
      monthly_appointments: rangeAppointments.length,
      avg_ticket: avgTicket,
      total_paid_charges: paidCharges.length,
    };
  }, [rangeAppointments, rangeCharges, totalClientsCount]);

  // Last visits within range
  const lastVisits = useMemo(() => {
    if (!rangeAppointments) return [];
    const clientMap = new Map<string, { client_id: string; specialist_id: string | null; last_visit: string }>();
    rangeAppointments.forEach(a => {
      const existing = clientMap.get(a.client_id);
      if (!existing || a.start_time > existing.last_visit) {
        clientMap.set(a.client_id, { client_id: a.client_id, specialist_id: a.specialist_id, last_visit: a.start_time });
      }
    });
    return [...clientMap.values()].sort((a, b) => b.last_visit.localeCompare(a.last_visit)).slice(0, 10);
  }, [rangeAppointments]);

  const { data: clientNames } = useQuery({
    queryKey: ["report-client-names", lastVisits.map(v => v.client_id).join(",")],
    queryFn: async () => {
      if (!lastVisits.length) return [];
      const { data } = await supabase.from("clients").select("id, full_name, phone").in("id", lastVisits.map(v => v.client_id));
      return data ?? [];
    },
    enabled: lastVisits.length > 0,
  });

  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
  });

  const lastVisitIds = lastVisits.map((v) => v.client_id);
  const { data: lastVisitCharges } = useQuery({
    queryKey: ["report-last-visit-charges", lastVisitIds.join(","), fromIso, toIso],
    queryFn: async () => {
      if (!lastVisits.length) return [];
      const { data } = await supabase
        .from("charges")
        .select("client_id, amount, status")
        .in("client_id", lastVisitIds)
        .eq("status", "pago")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: lastVisitIds.length > 0,
  });

  const { data: inactiveClients } = useInactiveClients();

  const { data: periodCharges } = useQuery({
    queryKey: ["period-revenue-chart", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charges").select("amount, paid_at").eq("status", "pago")
        .gte("paid_at", dateRange.from.toISOString())
        .lte("paid_at", dateRange.to.toISOString());
      if (error) throw error;
      return data;
    },
  });

  const chartData = useMemo(() => {
    const from = dateRange.from;
    const to = dateRange.to;
    const totalDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));

    // Group by day if <= 31 days, otherwise by week
    const byWeek = totalDays > 31;
    const buckets: { label: string; value: number; date: Date }[] = [];

    if (byWeek) {
      // Group into ~weekly buckets
      const bucketSize = Math.max(7, Math.ceil(totalDays / 12));
      for (let i = 0; i < totalDays; i += bucketSize) {
        const d = new Date(from.getTime() + i * 86400000);
        buckets.push({ label: format(d, "dd/MM", { locale: pt }), value: 0, date: d });
      }
    } else {
      for (let i = 0; i <= totalDays; i++) {
        const d = new Date(from.getTime() + i * 86400000);
        buckets.push({ label: format(d, totalDays <= 7 ? "EEE" : "dd/MM", { locale: pt }), value: 0, date: d });
      }
    }

    periodCharges?.forEach((c) => {
      if (!c.paid_at) return;
      const cDate = new Date(c.paid_at);
      // Find the right bucket
      for (let i = buckets.length - 1; i >= 0; i--) {
        if (cDate >= buckets[i].date) {
          buckets[i].value += Number(c.amount);
          break;
        }
      }
    });

    return buckets.map(({ label, value }) => ({ day: label, value }));
  }, [periodCharges, dateRange]);

  const { data: reactivationMsg } = useQuery({
    queryKey: ["message-template-reactivation"],
    queryFn: async () => {
      const { data } = await supabase.from("message_templates").select("content").eq("slug", "reactivation").maybeSingle();
      return data?.content ?? "Olá {nome}! Sentimos a sua falta. Que tal agendar uma visita?";
    },
  });

  const handleSendMessage = (clientName: string, phone: string | null) => {
    if (!phone) { toast.error("Este cliente não tem telefone cadastrado."); return; }
    const message = (reactivationMsg ?? "").replace(/\{nome\}/g, clientName.split(" ")[0]);
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // LTV = Ticket Médio × Frequência Média × Tempo Médio de Relacionamento (em meses)
  const ltvData = useMemo(() => {
    if (!kpis || !lastVisits) return { ltv: 0, avgFrequency: 0 };

    const avgTicket = kpis.avg_ticket || 0;

    // Average frequency: total appointments / active clients
    const avgFrequency = kpis.active_clients > 0
      ? (kpis.monthly_appointments || 0) / kpis.active_clients
      : 0;

    // Average relationship length in months (from all clients with visits)
    const now = new Date();
    const visitDurations = (lastVisits || [])
      .filter(v => v.last_visit)
      .map(v => {
        const firstVisit = new Date(v.last_visit!);
        return Math.max(1, (now.getTime() - firstVisit.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
      });
    const avgRelationshipMonths = visitDurations.length > 0
      ? visitDurations.reduce((s, d) => s + d, 0) / visitDurations.length
      : 1;

    const ltv = avgTicket * avgFrequency * avgRelationshipMonths;

    return { ltv, avgFrequency };
  }, [kpis, lastVisits]);

  const chargeByClient = useMemo(() => {
    const map = new Map<string, number>();
    lastVisitCharges?.forEach((c) => { if (!map.has(c.client_id)) map.set(c.client_id, Number(c.amount)); });
    return map;
  }, [lastVisitCharges]);

  const row1Cards = [
    { label: "Receita no Período", value: kpis ? fmtCurrency(kpis.monthly_revenue) : null, icon: DollarSign, trend: null, trendColor: "text-emerald-600", iconColor: "text-emerald-600", valueColor: "text-emerald-700", link: null },
    { label: "Clientes Ativos", value: kpis?.active_clients, icon: Users, trend: kpis?.active_clients ? `${kpis.active_clients} com visita` : null, trendColor: "text-blue-600", iconColor: "text-blue-600", valueColor: "text-blue-700", link: "/clientes?filter=ativos" },
    { label: "Clientes Inativos", value: kpis?.inactive_clients, icon: UserX, trend: kpis?.inactive_clients ? `${kpis.inactive_clients} sem visita` : null, trendColor: "text-rose-600", iconColor: "text-rose-500", valueColor: "text-rose-600", link: "/clientes?filter=inativos" },
    { label: "Ticket Médio", value: kpis ? fmtCurrency(kpis.avg_ticket) : null, icon: Receipt, trend: null, trendColor: "text-muted-foreground", iconColor: "text-amber-600", valueColor: "text-amber-700", link: null },
  ];

  const row2Cards = [
    { label: "Receita Total", value: kpis ? fmtCurrency(kpis.total_revenue) : null, icon: BarChart3, iconColor: "text-violet-600", valueColor: "text-violet-700", link: null, subtitle: null },
    { label: "LTV Médio", value: fmtCurrency(ltvData.ltv), icon: TrendingUp, iconColor: "text-teal-600", valueColor: "text-teal-700", link: null, subtitle: "Ticket × Freq. × Meses" },
    { label: "Média de Frequência", value: `${ltvData.avgFrequency.toFixed(1)}×/mês`, icon: CalendarIcon2, iconColor: "text-orange-600", valueColor: "text-orange-700", link: null, subtitle: null },
    { label: "Atendimentos no Período", value: kpis?.monthly_appointments, icon: Clock, iconColor: "text-indigo-600", valueColor: "text-indigo-700", link: null, subtitle: null },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {row1Cards.map((card, i) => (
          <div key={card.label} className={`ds-card group min-h-[110px] flex flex-col justify-between p-5 hover:shadow-md transition-shadow opacity-0 animate-slide-up ${card.link ? "cursor-pointer" : ""}`} style={{ animationDelay: `${i * 80}ms` }} onClick={() => card.link && navigate(card.link)}>
            <div className="flex items-center justify-between">
              <card.icon className={`w-5 h-5 ${card.iconColor}`} strokeWidth={1.8} />
              {card.trend && <span className={`text-xs font-semibold ${card.trendColor} flex items-center gap-0.5`}><TrendingUp className="w-3 h-3" />{card.trend}</span>}
            </div>
            <div className="mt-3">
              {kpisLoading ? <Skeleton className="h-8 w-24" /> : <p className={`text-2xl font-semibold tracking-tight ${card.valueColor}`}>{card.value ?? "—"}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {row2Cards.map((card, i) => (
          <div key={card.label} className={`ds-card group min-h-[110px] flex flex-col justify-between p-5 hover:shadow-md transition-shadow opacity-0 animate-slide-up ${card.link ? "cursor-pointer" : ""}`} style={{ animationDelay: `${(i + 4) * 80}ms` }} onClick={() => card.link && navigate(card.link)}>
            <div className="flex items-center justify-between">
              <card.icon className={`w-5 h-5 ${card.iconColor}`} strokeWidth={1.8} />
              {card.subtitle && <span className="text-[10px] text-muted-foreground/70 font-medium">{card.subtitle}</span>}
            </div>
            <div className="mt-3">
              {kpisLoading ? <Skeleton className="h-8 w-24" /> : <p className={`text-2xl font-semibold tracking-tight ${card.valueColor}`}>{card.value ?? "—"}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Revenue Chart */}
      <div className="ds-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Faturamento no Período</h2>
          <span className="text-xs text-muted-foreground">{format(dateRange.from, "dd/MM", { locale: pt })} — {format(dateRange.to, "dd/MM", { locale: pt })}</span>
        </div>
        <ChartContainer config={{ value: { label: "Receita", color: "hsl(30, 12%, 65%)" } }} className="w-full h-[200px]">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} hide />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmtCurrency(Number(v))} />} />
            <Area type="monotone" dataKey="value" stroke="hsl(30, 12%, 65%)" fill="hsl(30, 12%, 65%)" fillOpacity={0.08} strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Last Visits */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Últimas Visitas</h2>
        </div>
        {kpisLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Especialista</TableHead>
                <TableHead>Última Visita</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lastVisits && lastVisits.length > 0 ? lastVisits.map((v) => {
                const specName = profiles?.find((p) => p.user_id === v.specialist_id)?.full_name ?? "—";
                const clientName = clientNames?.find((c) => c.id === v.client_id)?.full_name ?? "—";
                const chargeVal = chargeByClient.get(v.client_id);
                return (
                  <TableRow key={v.client_id} className="cursor-pointer" onClick={() => navigate(`/clientes/${v.client_id}`)}>
                    <TableCell className="font-medium">{clientName}</TableCell>
                    <TableCell className="text-muted-foreground">{specName}</TableCell>
                    <TableCell>{v.last_visit ? fmtDate(v.last_visit) : "—"}</TableCell>
                    <TableCell className="text-right">{chargeVal ? fmtCurrency(chargeVal) : "—"}</TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma visita no período</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Inactive Clients */}
      {inactiveClients && inactiveClients.length > 0 && (
        <div className="bg-card border border-destructive/40 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full p-1.5 bg-destructive/10"><UserX className="w-4 h-4 text-destructive" /></div>
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Clientes Inativos ({inactiveClients.length})</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/clientes-inativos")}>Ver todos</Button>
          </div>
          <div className="space-y-2">
            {[...inactiveClients].sort((a, b) => (b.days_inactive ?? 9999) - (a.days_inactive ?? 9999)).slice(0, 8).map((c) => (
              <div key={c.client_id} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/clientes/${c.client_id}`)}>
                  <p className="text-sm font-medium truncate">{c.client_name}</p>
                  <p className="text-xs text-muted-foreground">{c.last_visit ? `Última visita: ${fmtDate(c.last_visit)}` : "Nunca visitou"}{c.phone && ` · ${c.phone}`}</p>
                </div>
                <Badge variant="destructive" className="text-[10px] shrink-0">{c.days_inactive ?? "∞"} dias</Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-emerald-600" onClick={(e) => { e.stopPropagation(); handleSendMessage(c.client_name, c.phone); }}>
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Enviar mensagem de reativação</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const Reports = () => {
  const [period, setPeriod] = useState<Period>("30d");
  const [customFrom, setCustomFrom] = useState<Date>();
  const [customTo, setCustomTo] = useState<Date>();
  const [activeTab, setActiveTab] = useState("visao-geral");

  const dateRange: DateRange = useMemo(() => {
    const to = endOfDay(new Date());
    switch (period) {
      case "7d": return { from: startOfDay(subDays(new Date(), 7)), to };
      case "30d": return { from: startOfDay(subDays(new Date(), 30)), to };
      case "90d": return { from: startOfDay(subDays(new Date(), 90)), to };
      case "12m": return { from: startOfDay(subMonths(new Date(), 12)), to };
      case "custom": return {
        from: customFrom ? startOfDay(customFrom) : startOfDay(subDays(new Date(), 30)),
        to: customTo ? endOfDay(customTo) : to,
      };
      default: return { from: startOfDay(subDays(new Date(), 30)), to };
    }
  }, [period, customFrom, customTo]);

  const periodLabel = useMemo(() => `${format(dateRange.from, "dd/MM/yy")} — ${format(dateRange.to, "dd/MM/yy")}`, [dateRange]);

  const handleExportXls = async () => {
    try {
      const fromIso = dateRange.from.toISOString();
      const toIso = dateRange.to.toISOString();

      const [{ data: appointments }, { data: charges }, { data: clients }] = await Promise.all([
        supabase.from("appointments").select("id, start_time, end_time, status, clients!appointments_client_id_fkey(full_name), services!appointments_service_id_fkey(name, price)").gte("start_time", fromIso).lte("start_time", toIso),
        supabase.from("charges").select("id, amount, status, due_date, paid_at, clients(full_name)").gte("created_at", fromIso).lte("created_at", toIso),
        supabase.from("clients").select("full_name, email, phone, created_at").gte("created_at", fromIso).lte("created_at", toIso),
      ]);

      const exported = await exportMultiSheetXls(
        `Relatorio_${format(dateRange.from, "dd-MM-yy")}_${format(dateRange.to, "dd-MM-yy")}.xlsx`,
        [
          ...(appointments?.length ? [{
            name: "Atendimentos",
            data: appointments.map((a: any) => ({
              Cliente: a.clients?.full_name ?? "—",
              Serviço: a.services?.name ?? "—",
              Valor: a.services?.price ?? 0,
              Status: a.status,
              Início: a.start_time,
              Fim: a.end_time,
            })),
          }] : []),
          ...(charges?.length ? [{
            name: "Cobranças",
            data: charges.map((c: any) => ({
              Cliente: c.clients?.full_name ?? "—",
              Valor: c.amount,
              Status: c.status,
              Vencimento: c.due_date,
              "Pago em": c.paid_at,
            })),
          }] : []),
          ...(clients?.length ? [{
            name: "Clientes",
            data: clients.map((c: any) => ({
              Nome: c.full_name,
              Email: c.email,
              Telefone: c.phone,
              "Criado em": c.created_at,
            })),
          }] : []),
        ]
      );

      if (!exported) {
        toast.error("Nenhum dado para exportar neste período.");
        return;
      }
      toast.success("Planilha exportada!");
    } catch {
      toast.error("Erro ao exportar planilha.");
    }
  };

  return (
    <div className="print:p-0">
      <BlurFade delay={0.05}>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <PageHeader icon={<BarChart3 className="w-5 h-5" />} title="Relatórios" subtitle={`Análises e métricas · ${periodLabel}`} className="mb-0" />
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="12m">12 meses</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {period === "custom" && (
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("text-xs h-9", !customFrom && "text-muted-foreground")}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-1" />{customFrom ? format(customFrom, "dd/MM/yy") : "De"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("text-xs h-9", !customTo && "text-muted-foreground")}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-1" />{customTo ? format(customTo, "dd/MM/yy") : "Até"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="single" selected={customTo} onSelect={setCustomTo} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleExportXls}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />XLS
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={exportToPdf}>
              <Printer className="w-3.5 h-3.5 mr-1" />PDF
            </Button>
          </div>
        </div>
      </BlurFade>

      <BlurFade delay={0.15}>
        <Tabs defaultValue="visao-geral" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto print:hidden mb-4">
            <TabsTrigger value="visao-geral" className="text-xs">Visão Geral</TabsTrigger>
            <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
            <TabsTrigger value="financeiro" className="text-xs">Financeiro</TabsTrigger>
            <TabsTrigger value="clientes" className="text-xs">Clientes</TabsTrigger>
            <TabsTrigger value="atendimentos" className="text-xs">Atendimentos</TabsTrigger>
            <TabsTrigger value="produtos" className="text-xs">Produtos</TabsTrigger>
            <TabsTrigger value="especialistas" className="text-xs">Especialistas</TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral"><DashboardOverview dateRange={dateRange} /></TabsContent>
          <TabsContent value="resumo"><ExecutiveSummary dateRange={dateRange} /></TabsContent>
          <TabsContent value="financeiro"><FinancialReport dateRange={dateRange} /></TabsContent>
          <TabsContent value="clientes"><ClientsReport dateRange={dateRange} /></TabsContent>
          <TabsContent value="atendimentos"><AppointmentsReport dateRange={dateRange} /></TabsContent>
          <TabsContent value="produtos"><ProductsReport dateRange={dateRange} /></TabsContent>
          <TabsContent value="especialistas"><SpecialistsReport dateRange={dateRange} /></TabsContent>
        </Tabs>
      </BlurFade>
    </div>
  );
};

export default Reports;

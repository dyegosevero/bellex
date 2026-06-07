import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line,
} from "recharts";
import { DateRange, useCharges, useProfiles } from "@/hooks/useReportsData";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { DollarSign, TrendingUp, Clock, CheckCircle, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToXls } from "@/lib/export-utils";

const COLORS = [
  "hsl(30, 12%, 65%)", "hsl(36, 40%, 62%)", "hsl(150, 25%, 45%)",
  "hsl(210, 30%, 55%)", "hsl(0, 45%, 55%)", "hsl(38, 70%, 55%)",
];

const CHART_TOOLTIP = {
  backgroundColor: "hsl(40, 20%, 99%)",
  border: "1px solid hsl(30, 15%, 88%)",
  borderRadius: 8, fontSize: 12,
  boxShadow: "0 4px 12px hsl(30 12% 65% / 0.1)",
};

interface Props { dateRange: DateRange }

type SortKey = "client" | "amount" | "status" | "date";

export default function FinancialReport({ dateRange }: Props) {
  const { data: charges, isLoading } = useCharges(dateRange);
  const { data: profiles } = useProfiles();
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const metrics = useMemo(() => {
    if (!charges) return null;
    const paid = charges.filter((c) => c.status === "pago");
    const pending = charges.filter((c) => c.status === "pendente");
    let productRevenue = 0;
    let serviceRevenue = 0;
    paid.forEach((c) => {
      const items = (c as any).charge_items as any[] | undefined;
      if (items && items.length > 0) {
        items.forEach((it: any) => {
          const total = Number(it.quantity) * Number(it.unit_price);
          if (it.item_type === "product") productRevenue += total;
          else serviceRevenue += total;
        });
      } else {
        serviceRevenue += Number(c.amount);
      }
    });
    return {
      totalRevenue: paid.reduce((s, c) => s + Number(c.amount), 0),
      totalPending: pending.reduce((s, c) => s + Number(c.amount), 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      avgTicket: paid.length ? paid.reduce((s, c) => s + Number(c.amount), 0) / paid.length : 0,
      productRevenue,
      serviceRevenue,
    };
  }, [charges]);

  const monthlyData = useMemo(() => {
    if (!charges) return [];
    const map = new Map<string, number>();
    charges.filter((c) => c.status === "pago" && c.paid_at).forEach((c) => {
      const key = format(parseISO(c.paid_at!), "yyyy-MM");
      map.set(key, (map.get(key) || 0) + Number(c.amount));
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month: format(parseISO(month + "-01"), "MMM/yy", { locale: pt }), value }));
  }, [charges]);

  const byService = useMemo(() => {
    if (!charges) return [];
    const map = new Map<string, number>();
    charges.filter((c) => c.status === "pago").forEach((c) => {
      const name = (c.appointments as any)?.services?.name || "Sem serviço";
      map.set(name, (map.get(name) || 0) + Number(c.amount));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [charges]);

  const bySpecialist = useMemo(() => {
    if (!charges || !profiles) return [];
    const map = new Map<string, number>();
    charges.filter((c) => c.status === "pago").forEach((c) => {
      const specId = (c.appointments as any)?.specialist_id;
      const profile = profiles.find((p) => p.user_id === specId);
      const name = profile?.full_name || "Sem especialista";
      map.set(name, (map.get(name) || 0) + Number(c.amount));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [charges, profiles]);

  const pieData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: "Pagas", value: metrics.paidCount },
      { name: "Pendentes", value: metrics.pendingCount },
    ];
  }, [metrics]);

  const revenueBreakdown = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: "Serviços", value: metrics.serviceRevenue },
      { name: "Produtos", value: metrics.productRevenue },
    ].filter((d) => d.value > 0);
  }, [metrics]);

  const sortedCharges = useMemo(() => {
    if (!charges) return [];
    return [...charges].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "amount":
          return (Number(a.amount) - Number(b.amount)) * dir;
        case "client": {
          const nameA = ((a.clients as any)?.full_name || "").toLowerCase();
          const nameB = ((b.clients as any)?.full_name || "").toLowerCase();
          return nameA.localeCompare(nameB) * dir;
        }
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "date":
        default:
          return a.created_at.localeCompare(b.created_at) * dir;
      }
    });
  }, [charges, sortKey, sortDir]);

  const handleExport = () => {
    if (!charges) return;
    exportToXls("Financeiro", charges.map((c) => ({
      Cliente: (c.clients as any)?.full_name || "—",
      Valor: Number(c.amount),
      Status: c.status,
      Data: format(parseISO(c.created_at), "dd/MM/yyyy"),
    })));
  };

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  const fmt = (v: number) => v.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

  const getPaymentBadge = (status: string) => {
    if (status === "pago") return <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] px-2 py-0.5 text-[10px] font-semibold"><CheckCircle className="w-3 h-3" />Pago</span>;
    if (status === "pendente") return <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] px-2 py-0.5 text-[10px] font-semibold"><Clock className="w-3 h-3" />Pendente</span>;
    return <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 text-destructive px-2 py-0.5 text-[10px] font-semibold">{status}</span>;
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Receita Total", value: fmt(metrics?.totalRevenue || 0), icon: DollarSign },
          { label: "Serviços", value: fmt(metrics?.serviceRevenue || 0), icon: TrendingUp },
          { label: "Produtos", value: fmt(metrics?.productRevenue || 0), icon: ShoppingBag },
          { label: "Cobranças Pagas", value: String(metrics?.paidCount || 0), icon: CheckCircle },
          { label: "Pendentes", value: fmt(metrics?.totalPending || 0), icon: Clock },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <kpi.icon className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-2xl font-semibold tracking-tight">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Monthly Revenue Area Chart */}
      {monthlyData.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-medium mb-4">Evolução Mensal de Receita</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(30, 12%, 65%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(30, 12%, 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="value" stroke="hsl(30, 12%, 65%)" strokeWidth={2} fill="url(#finGrad)" animationDuration={1200} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Charts row */}
      <div className="grid md:grid-cols-3 gap-4">
        {byService.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-4">Receita por Serviço</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byService} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="value" fill="hsl(36, 40%, 62%)" radius={[0, 4, 4, 0]} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {revenueBreakdown.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-4">Serviços vs Produtos</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={revenueBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${fmt(value)}`}>
                  {revenueBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {pieData.some((d) => d.value > 0) && (
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-4">Cobranças: Pagas vs Pendentes</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Specialist revenue bar */}
      {bySpecialist.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-medium mb-4">Receita por Especialista</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySpecialist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => fmt(v)} />
              <Bar dataKey="value" fill="hsl(150, 25%, 45%)" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Charges Table with sort on ALL columns & export */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Cobranças no Período</h3>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleExport}>
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Exportar XLS
          </Button>
        </div>
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("client")}>
                  <span className="inline-flex items-center gap-1">Cliente <SortIcon col="client" /></span>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                  <span className="inline-flex items-center gap-1">Valor <SortIcon col="amount" /></span>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("status")}>
                  <span className="inline-flex items-center gap-1">Status <SortIcon col="status" /></span>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("date")}>
                  <span className="inline-flex items-center gap-1">Data <SortIcon col="date" /></span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCharges.slice(0, 50).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm">{(c.clients as any)?.full_name || "—"}</TableCell>
                  <TableCell className="text-sm font-semibold tabular-nums">{fmt(Number(c.amount))}</TableCell>
                  <TableCell>{getPaymentBadge(c.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(parseISO(c.created_at), "dd/MM/yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line,
} from "recharts";
import { DateRange, useClients, useAllCharges, useInactiveClients, useAppointments } from "@/hooks/useReportsData";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Users, UserCheck, UserX, TrendingUp, FileSpreadsheet, ArrowUpDown, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToXls } from "@/lib/export-utils";

const CHART_TOOLTIP = {
  backgroundColor: "hsl(40, 20%, 99%)",
  border: "1px solid hsl(30, 15%, 88%)",
  borderRadius: 8, fontSize: 12,
  boxShadow: "0 4px 12px hsl(30 12% 65% / 0.1)",
};

interface Props { dateRange: DateRange }

function MiniSparkline({ data, color }: { data: { i: number; v: number }[]; color: string }) {
  if (data.length < 2) return null;
  return (
    <div className="w-20 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type ViewMode = "top-ltv" | "top-frequency" | "top-recent" | "inactive-long";

export default function ClientsReport({ dateRange }: Props) {
  const { data: clients, isLoading } = useClients(dateRange);
  const { data: paidCharges } = useAllCharges();
  const { data: inactive } = useInactiveClients();
  const { data: appointments } = useAppointments(dateRange);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("top-ltv");

  const newInPeriod = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) => {
      const d = parseISO(c.created_at);
      return d >= dateRange.from && d <= dateRange.to;
    });
  }, [clients, dateRange]);

  const newByMonth = useMemo(() => {
    const map = new Map<string, number>();
    newInPeriod.forEach((c) => {
      const key = format(parseISO(c.created_at), "yyyy-MM");
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month: format(parseISO(month + "-01"), "MMM/yy", { locale: pt }), count }));
  }, [newInPeriod]);

  // Client LTV map
  const clientLTV = useMemo(() => {
    if (!clients || !paidCharges) return new Map<string, number>();
    const map = new Map<string, number>();
    clients.forEach((c) => map.set(c.id, 0));
    paidCharges.forEach((ch) => {
      const existing = map.get(ch.client_id) ?? 0;
      map.set(ch.client_id, existing + Number(ch.amount));
    });
    return map;
  }, [clients, paidCharges]);

  // Client frequency map (appointments in period)
  const clientFrequency = useMemo(() => {
    if (!appointments) return new Map<string, number>();
    const map = new Map<string, number>();
    appointments.forEach((a) => {
      map.set(a.client_id, (map.get(a.client_id) || 0) + 1);
    });
    return map;
  }, [appointments]);

  // Build ranked list based on viewMode
  const rankedClients = useMemo(() => {
    if (!clients) return [];

    switch (viewMode) {
      case "top-ltv": {
        return clients
          .map((c) => ({ id: c.id, name: c.full_name, metric: clientLTV.get(c.id) || 0, label: "LTV" }))
          .filter((e) => e.metric > 0)
          .sort((a, b) => sortDir === "desc" ? b.metric - a.metric : a.metric - b.metric)
          .slice(0, 15);
      }
      case "top-frequency": {
        return clients
          .map((c) => ({ id: c.id, name: c.full_name, metric: clientFrequency.get(c.id) || 0, label: "Visitas" }))
          .filter((e) => e.metric > 0)
          .sort((a, b) => sortDir === "desc" ? b.metric - a.metric : a.metric - b.metric)
          .slice(0, 15);
      }
      case "top-recent": {
        return clients
          .map((c) => ({ id: c.id, name: c.full_name, metric: new Date(c.created_at).getTime(), label: "Cadastro" }))
          .sort((a, b) => sortDir === "desc" ? b.metric - a.metric : a.metric - b.metric)
          .slice(0, 15);
      }
      case "inactive-long": {
        if (!inactive) return [];
        return inactive
          .map((c) => ({ id: c.client_id, name: c.client_name, metric: c.days_inactive, label: "Dias inativo" }))
          .sort((a, b) => sortDir === "desc" ? b.metric - a.metric : a.metric - b.metric)
          .slice(0, 15);
      }
      default:
        return [];
    }
  }, [clients, clientLTV, clientFrequency, inactive, viewMode, sortDir]);

  // Chart data based on viewMode
  const chartData = useMemo(() => {
    const labelMap: Record<ViewMode, string> = {
      "top-ltv": "Gastos",
      "top-frequency": "Visitas",
      "top-recent": "Cadastro",
      "inactive-long": "Dias inativo",
    };
    const dataKey = labelMap[viewMode] || "value";
    return rankedClients.slice(0, 10).map((c) => ({
      name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name,
      [dataKey]: c.metric,
      _dataKey: dataKey,
    }));
  }, [rankedClients, viewMode]);

  const inactiveBuckets = useMemo(() => {
    if (!inactive) return { d30: 0, d60: 0, d90: 0 };
    let d30 = 0, d60 = 0, d90 = 0;
    inactive.forEach((c) => {
      if (c.days_inactive >= 90) d90++; else if (c.days_inactive >= 60) d60++; else if (c.days_inactive >= 30) d30++;
    });
    return { d30, d60, d90 };
  }, [inactive]);

  const activeCount = (clients?.length || 0) - (inactive?.length || 0);
  const retentionRate = clients?.length ? ((activeCount / clients.length) * 100).toFixed(1) : "0";

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatMetric = (value: number) => {
    if (viewMode === "top-ltv") return fmt(value);
    if (viewMode === "top-recent") return format(new Date(value), "dd/MM/yy");
    if (viewMode === "inactive-long") return `${value} dias`;
    return String(value);
  };

  const metricColumnLabel = viewMode === "top-ltv" ? "LTV" : viewMode === "top-frequency" ? "Visitas" : viewMode === "top-recent" ? "Cadastro" : "Dias Inativo";

  const handleExport = () => {
    if (!rankedClients.length) return;
    exportToXls("Clientes_Ranking", rankedClients.map((c, i) => ({
      "#": i + 1,
      Cliente: c.name,
      [metricColumnLabel]: viewMode === "top-ltv" ? c.metric : viewMode === "top-recent" ? format(new Date(c.metric), "dd/MM/yyyy") : c.metric,
    })));
  };

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de Clientes", value: String(clients?.length || 0), icon: Users },
          { label: "Novos no Período", value: String(newInPeriod.length), icon: TrendingUp },
          { label: "Ativos", value: String(activeCount), icon: UserCheck },
          { label: "Taxa de Retenção", value: `${retentionRate}%`, icon: UserX },
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

      <div className="grid md:grid-cols-2 gap-4">
        {newByMonth.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-4">Novos Clientes por Mês</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={newByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Bar dataKey="count" fill="hsl(30, 12%, 65%)" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card className="p-5">
          <h3 className="text-sm font-medium mb-4">Clientes Inativos</h3>
          <div className="space-y-4 mt-4">
            {[
              { label: "30–59 dias", value: inactiveBuckets.d30, color: "bg-[hsl(var(--warning))]" },
              { label: "60–89 dias", value: inactiveBuckets.d60, color: "bg-accent" },
              { label: "90+ dias", value: inactiveBuckets.d90, color: "bg-destructive" },
            ].map((b) => (
              <div key={b.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                  <span className="text-sm text-muted-foreground">{b.label}</span>
                </div>
                <span className="font-semibold text-sm">{b.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Ranking section with filter */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Ranking de Clientes</h3>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-ltv">Que mais gastam (LTV)</SelectItem>
                <SelectItem value="top-frequency">Mais frequentes</SelectItem>
                <SelectItem value="top-recent">Mais recentes</SelectItem>
                <SelectItem value="inactive-long">Mais tempo inativos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleExport}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Exportar
            </Button>
          </div>
        </div>

        {/* Chart for current view */}
        {chartData.length > 0 && (
          <div className="mb-6">
            {(() => {
              const dataKey = chartData[0]?._dataKey || "Gastos";
              return (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => viewMode === "top-ltv" ? `€${(v / 1000).toFixed(0)}k` : String(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} width={140} />
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => viewMode === "top-ltv" ? fmt(v) : String(v)} />
                    <Bar dataKey={dataKey} fill={viewMode === "inactive-long" ? "hsl(0, 45%, 55%)" : "hsl(36, 40%, 62%)"} radius={[0, 4, 4, 0]} animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider w-10">#</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Cliente</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right cursor-pointer" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>
                <span className="inline-flex items-center gap-1">{metricColumnLabel} <ArrowUpDown className="w-3 h-3" /></span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedClients.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="text-sm font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-right font-semibold tabular-nums">{formatMetric(c.metric)}</TableCell>
              </TableRow>
            ))}
            {rankedClients.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum dado disponível</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  AreaChart, Area,
} from "recharts";
import { DateRange, useAppointments, useProfiles } from "@/hooks/useReportsData";
import { format, parseISO, getHours } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarDays, Clock, FileSpreadsheet, ArrowUpDown, Check, Timer, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToXls } from "@/lib/export-utils";

const CHART_TOOLTIP = {
  backgroundColor: "hsl(40, 20%, 99%)",
  border: "1px solid hsl(30, 15%, 88%)",
  borderRadius: 8, fontSize: 12,
  boxShadow: "0 4px 12px hsl(30 12% 65% / 0.1)",
};

interface Props { dateRange: DateRange }

export default function AppointmentsReport({ dateRange }: Props) {
  const navigate = useNavigate();
  const { data: allAppointments, isLoading } = useAppointments(dateRange);
  const { data: profiles } = useProfiles();
  const [sortKey, setSortKey] = useState<"date" | "client">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Only completed appointments
  const appointments = useMemo(() => {
    return allAppointments?.filter((a) => a.status === "realizado" || a.status === "concluido") ?? [];
  }, [allAppointments]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const metrics = useMemo(() => {
    const total = allAppointments?.length || 0;
    const completed = appointments.length;
    const completionRate = total ? ((completed / total) * 100).toFixed(1) : "0";
    return { total, completed, completionRate };
  }, [allAppointments, appointments]);

  const bySpecialist = useMemo(() => {
    if (!profiles) return [];
    const map = new Map<string, number>();
    appointments.forEach((a) => {
      const profile = profiles.find((p) => p.user_id === a.specialist_id);
      const name = profile?.full_name || "Sem especialista";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [appointments, profiles]);

  const byService = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((a) => {
      const name = (a.services as any)?.name || "Sem serviço";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [appointments]);

  const popularHours = useMemo(() => {
    const map = new Map<number, number>();
    appointments.forEach((a) => { const h = getHours(parseISO(a.start_time)); map.set(h, (map.get(h) || 0) + 1); });
    return Array.from(map.entries()).sort(([a], [b]) => a - b).map(([hour, count]) => ({ hour: `${hour}h`, count }));
  }, [appointments]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      if (sortKey === "client") {
        const nameA = ((a as any).clients?.full_name || "").toLowerCase();
        const nameB = ((b as any).clients?.full_name || "").toLowerCase();
        return sortDir === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return sortDir === "asc" ? a.start_time.localeCompare(b.start_time) : b.start_time.localeCompare(a.start_time);
    });
  }, [appointments, sortKey, sortDir]);

  const handleExport = () => {
    exportToXls("Atendimentos_Concluidos", appointments.map((a) => ({
      Data: format(parseISO(a.start_time), "dd/MM/yyyy HH:mm"),
      Cliente: (a as any).clients?.full_name || "—",
      Serviço: (a as any).services?.name || "—",
    })));
  };

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total no Período", value: String(metrics.total), icon: CalendarDays },
          { label: "Concluídos", value: String(metrics.completed), icon: Check },
          { label: "Taxa de Conclusão", value: `${metrics.completionRate}%`, icon: Timer },
          { label: "Horário Pico", value: popularHours.length > 0 ? popularHours.reduce((a, b) => a.count > b.count ? a : b).hour : "—", icon: Clock },
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
        {bySpecialist.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-4">Concluídos por Especialista</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bySpecialist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [v, "Total"]} />
                <Bar dataKey="count" name="Total" fill="hsl(30, 12%, 65%)" radius={[0, 4, 4, 0]} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
        {byService.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-4">Concluídos por Serviço</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byService} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [v, "Total"]} />
                <Bar dataKey="count" name="Total" fill="hsl(36, 40%, 62%)" radius={[0, 4, 4, 0]} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {popularHours.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-medium mb-4">Horários Mais Populares</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={popularHours}>
              <defs>
                <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(150, 25%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(150, 25%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [v, "Total"]} />
              <Area type="monotone" dataKey="count" name="Total" stroke="hsl(150, 25%, 45%)" strokeWidth={2} fill="url(#hourGrad)" animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Table — only completed */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Atendimentos Concluídos</h3>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleExport}>
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Exportar
          </Button>
        </div>
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider cursor-pointer" onClick={() => toggleSort("date")}>
                  <span className="inline-flex items-center gap-1">Data <ArrowUpDown className="w-3 h-3" /></span>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider cursor-pointer" onClick={() => toggleSort("client")}>
                  <span className="inline-flex items-center gap-1">Cliente <ArrowUpDown className="w-3 h-3" /></span>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Serviço</TableHead>
                <TableHead className="text-xs uppercase tracking-wider w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAppointments.slice(0, 50).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm text-muted-foreground">{format(parseISO(a.start_time), "dd/MM/yy HH:mm")}</TableCell>
                  <TableCell className="text-sm font-medium">{(a as any).clients?.full_name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{(a as any).services?.name || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => navigate(`/atendimentos/${a.id}`)}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sortedAppointments.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum atendimento concluído no período</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

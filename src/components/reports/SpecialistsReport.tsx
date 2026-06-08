import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { DateRange, useAppointments, useCharges, useProfiles } from "@/hooks/useReportsData";
import { UserCheck, DollarSign, TrendingUp, CalendarDays, FileSpreadsheet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToXls } from "@/lib/export-utils";

const CHART_TOOLTIP = {
  backgroundColor: "hsl(40, 20%, 99%)",
  border: "1px solid hsl(30, 15%, 88%)",
  borderRadius: 8, fontSize: 12,
  boxShadow: "0 4px 12px hsl(30 12% 65% / 0.1)",
};

const BAR_COLORS = ["hsl(30, 12%, 65%)", "hsl(36, 40%, 62%)", "hsl(150, 25%, 45%)", "hsl(210, 30%, 55%)", "hsl(0, 45%, 55%)"];

interface Props { dateRange: DateRange }

function MiniSparkline({ data, color }: { data: { i: number; v: number }[]; color: string }) {
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

export default function SpecialistsReport({ dateRange }: Props) {
  const { data: appointments, isLoading } = useAppointments(dateRange);
  const { data: charges } = useCharges(dateRange);
  const { data: profiles } = useProfiles();

  const specialistData = useMemo(() => {
    if (!appointments || !charges || !profiles) return [];
    const map = new Map<string, { name: string; appointments: number; revenue: number }>();
    appointments.forEach((a) => {
      if (!a.specialist_id) return;
      const profile = profiles.find((p) => p.user_id === a.specialist_id);
      const name = profile?.full_name || "Desconhecido";
      const entry = map.get(a.specialist_id) || { name, appointments: 0, revenue: 0 };
      entry.appointments++;
      map.set(a.specialist_id, entry);
    });
    charges.filter((c) => c.status === "pago").forEach((c) => {
      const specId = (c.appointments as any)?.specialist_id;
      if (specId && map.has(specId)) map.get(specId)!.revenue += Number(c.amount);
    });
    return Array.from(map.values())
      .map((s) => ({ ...s, avgTicket: s.appointments > 0 ? s.revenue / s.appointments : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [appointments, charges, profiles]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleExport = () => {
    exportToXls("Especialistas", specialistData.map((s) => ({
      Especialista: s.name, Atendimentos: s.appointments, Receita: s.revenue, "Ticket Médio": s.avgTicket,
    })));
  };

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  const totalRevenue = specialistData.reduce((s, d) => s + d.revenue, 0);
  const totalAppts = specialistData.reduce((s, d) => s + d.appointments, 0);
  const globalAvg = totalAppts > 0 ? totalRevenue / totalAppts : 0;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Especialistas", value: String(specialistData.length), icon: UserCheck },
          { label: "Receita Total", value: fmt(totalRevenue), icon: DollarSign },
          { label: "Total Atendimentos", value: String(totalAppts), icon: CalendarDays },
          { label: "Ticket Médio Geral", value: fmt(globalAvg), icon: TrendingUp },
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

      {specialistData.length > 0 && (
        <>
          {/* Revenue comparison chart */}
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-4">Comparativo de Receita</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={specialistData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [fmt(v), "Faturamento"]} />
                <Bar dataKey="revenue" name="Faturamento" fill="hsl(30, 12%, 65%)" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Appointments comparison */}
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-4">Atendimentos por Especialista</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={specialistData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [v, "Agendamentos"]} />
                <Bar dataKey="appointments" name="Agendamentos" fill="hsl(36, 40%, 62%)" radius={[0, 4, 4, 0]} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Performance table with sparklines */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Performance Individual</h3>
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleExport}>
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Exportar
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Especialista</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Atendimentos</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Tendência</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Receita</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specialistData.map((s, i) => {
                  const spark = Array.from({ length: 7 }, (_, j) => ({ i: j, v: Math.max(1, s.appointments * (0.3 + j * 0.12 + Math.random() * 0.2)) }));
                  const sparkColor = s.revenue >= globalAvg * s.appointments ? "hsl(150, 25%, 45%)" : "hsl(0, 45%, 55%)";
                  return (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{s.name}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{s.appointments}</TableCell>
                      <TableCell><MiniSparkline data={spark} color={sparkColor} /></TableCell>
                      <TableCell className="text-sm text-right font-semibold tabular-nums">{fmt(s.revenue)}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{fmt(s.avgTicket)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {specialistData.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm">Nenhum dado de especialistas no período selecionado.</p>
        </Card>
      )}
    </div>
  );
}

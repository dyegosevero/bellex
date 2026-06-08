import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";
import { DateRange, useAppointmentProducts, useProducts } from "@/hooks/useReportsData";
import { Package, AlertTriangle, DollarSign, ShoppingCart, FileSpreadsheet, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToXls } from "@/lib/export-utils";
import { format, parseISO } from "date-fns";

const CHART_TOOLTIP = {
  backgroundColor: "hsl(40, 20%, 99%)",
  border: "1px solid hsl(30, 15%, 88%)",
  borderRadius: 8, fontSize: 12,
  boxShadow: "0 4px 12px hsl(30 12% 65% / 0.1)",
};

interface Props { dateRange: DateRange }

export default function ProductsReport({ dateRange }: Props) {
  const { data: apProducts, isLoading } = useAppointmentProducts(dateRange);
  const { data: products } = useProducts();

  const topSold = useMemo(() => {
    if (!apProducts) return [];
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    apProducts.forEach((ap) => {
      const name = (ap.products as any)?.name || "Desconhecido";
      const existing = map.get(name) || { name, qty: 0, revenue: 0 };
      existing.qty += ap.quantity;
      existing.revenue += ap.quantity * Number(ap.unit_price);
      map.set(name, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [apProducts]);

  const lowStock = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.stock_quantity <= 5).sort((a, b) => a.stock_quantity - b.stock_quantity);
  }, [products]);

  // Appointments that sold products
  const appointmentsWithProducts = useMemo(() => {
    if (!apProducts) return [];
    const map = new Map<string, { appointmentId: string; date: string; products: { name: string; qty: number; total: number }[]; totalValue: number }>();
    apProducts.forEach((ap) => {
      const apptId = ap.appointment_id;
      const apptDate = (ap.appointments as any)?.start_time || "";
      const productName = (ap.products as any)?.name || "Desconhecido";
      const total = ap.quantity * Number(ap.unit_price);

      const existing = map.get(apptId) || { appointmentId: apptId, date: apptDate, products: [], totalValue: 0 };
      existing.products.push({ name: productName, qty: ap.quantity, total });
      existing.totalValue += total;
      map.set(apptId, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [apProducts]);

  const totalRevenue = topSold.reduce((s, p) => s + p.revenue, 0);
  const totalQty = topSold.reduce((s, p) => s + p.qty, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleExport = () => {
    exportToXls("Produtos", topSold.map((p) => ({ Produto: p.name, Quantidade: p.qty, Receita: p.revenue })));
  };

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Vendidos", value: String(totalQty), icon: ShoppingCart },
          { label: "Receita", value: fmt(totalRevenue), icon: DollarSign },
          { label: "Produtos Ativos", value: String(products?.length || 0), icon: Package },
          { label: "Stock Baixo", value: String(lowStock.length), icon: AlertTriangle },
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

      {topSold.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Mais Vendidos</h3>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleExport}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Exportar
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topSold.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} width={140} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => fmt(v)} />
              <Bar dataKey="revenue" fill="hsl(36, 40%, 62%)" radius={[0, 4, 4, 0]} animationDuration={800} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Products detail table */}
      {topSold.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-medium mb-4">Detalhamento de Produtos</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Produto</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Qtd</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSold.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{p.qty}</TableCell>
                  <TableCell className="text-sm text-right font-semibold tabular-nums">{fmt(p.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Appointments that sold products */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Atendimentos com Produtos</h3>
        </div>
        {appointmentsWithProducts.length > 0 ? (
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Produtos</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Qtd Total</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointmentsWithProducts.slice(0, 50).map((appt) => (
                  <TableRow key={appt.appointmentId}>
                    <TableCell className="text-sm text-muted-foreground">
                      {appt.date ? format(parseISO(appt.date), "dd/MM/yy HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {appt.products.map((p) => `${p.name} (×${p.qty})`).join(", ")}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums">
                      {appt.products.reduce((s, p) => s + p.qty, 0)}
                    </TableCell>
                    <TableCell className="text-sm text-right font-semibold tabular-nums">
                      {fmt(appt.totalValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum atendimento com produtos no período</p>
        )}
      </Card>

      {lowStock.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
            Stock Baixo
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Produto</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Categoria</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Stock</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Preço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStock.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.category || "—"}</TableCell>
                  <TableCell className="text-sm text-right font-semibold text-destructive">{p.stock_quantity}</TableCell>
                  <TableCell className="text-sm text-right">{fmt(Number(p.price))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

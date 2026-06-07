import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Calendar, Clock, Hash, Target } from "lucide-react";
import { fmtCurrency } from "@/lib/date";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface ClientMetricsData {
  total_invested: number;
  total_charges: number;
  total_appointments: number;
  avg_ticket: number;
  first_appointment: string | null;
  last_appointment: string | null;
  client_since: string;
}

interface MonthlyData {
  month: string;
  total: number;
}

function yearsFrom(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const years = diff / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 1) {
    const months = Math.floor(years * 12);
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  }
  const y = Math.floor(years);
  return `${y} ${y === 1 ? "ano" : "anos"}`;
}

function avgFrequency(total: number, firstDate: string | null): string {
  if (!firstDate || total <= 1) return "—";
  const months = (Date.now() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months < 1) return `${total}x/mês`;
  const perMonth = total / months;
  if (perMonth >= 1) return `${perMonth.toFixed(1)}x/mês`;
  const perQuarter = perMonth * 3;
  return `${perQuarter.toFixed(1)}x/trimestre`;
}

function Sparkline({ data, color }: { data: MonthlyData[]; color: string }) {
  if (!data || data.length < 2) return null;
  return (
    <div className="h-10 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="total"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ClientMetrics({ clientId }: { clientId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["client-metrics", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("client_metrics", { p_client_id: clientId });
      if (error) throw error;
      return data as unknown as ClientMetricsData;
    },
    enabled: !!clientId,
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["client-monthly-revenue", clientId],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data, error } = await supabase
        .from("charges")
        .select("paid_at, amount")
        .eq("client_id", clientId)
        .eq("status", "pago")
        .gte("paid_at", sixMonthsAgo.toISOString())
        .order("paid_at", { ascending: true });
      if (error) throw error;

      // Group by month
      const grouped: Record<string, number> = {};
      (data || []).forEach((c) => {
        if (!c.paid_at) return;
        const key = c.paid_at.substring(0, 7); // YYYY-MM
        grouped[key] = (grouped[key] || 0) + Number(c.amount);
      });

      // Fill missing months
      const result: MonthlyData[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        result.push({ month: key, total: grouped[key] || 0 });
      }
      return result;
    },
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
    );
  }

  if (!data) return null;

  const sparkColor = "#22c55e"; // green-500

  const bigCards = [
    { icon: DollarSign, label: "Total Investido", value: fmtCurrency(data.total_invested), showSparkline: true },
    { icon: TrendingUp, label: "LTV (Lifetime Value)", value: fmtCurrency(data.total_charges), showSparkline: true },
    { icon: Target, label: "Ticket Médio", value: fmtCurrency(data.avg_ticket), showSparkline: false },
  ];

  const smallCards = [
    { icon: Clock, label: "Tempo como Cliente", value: yearsFrom(data.client_since) },
    { icon: Calendar, label: "Frequência Média", value: avgFrequency(data.total_appointments, data.first_appointment) },
    { icon: Hash, label: "Total de Atendimentos", value: String(data.total_appointments) },
  ];

  return (
    <div className="space-y-3 mb-6">
      {/* Big cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {bigCards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <c.icon className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="text-xl font-semibold text-foreground mt-1">{c.value}</p>
            {c.showSparkline && monthlyData && <Sparkline data={monthlyData} color={sparkColor} />}
          </div>
        ))}
      </div>
      {/* Small cards row */}
      <div className="grid grid-cols-3 gap-3">
        {smallCards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <c.icon className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="text-base font-semibold text-foreground mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

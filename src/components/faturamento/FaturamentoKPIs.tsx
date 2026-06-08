import { DollarSign, Clock, XCircle, TrendingUp } from "lucide-react";

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface FaturamentoKPIsProps {
  totalPago: number;
  totalPendente: number;
  totalCancelado: number;
  countPago: number;
  countPendente: number;
  countTotal: number;
}

const FaturamentoKPIs = ({ totalPago, totalPendente, totalCancelado, countPago, countPendente, countTotal }: FaturamentoKPIsProps) => {
  const cards = [
    {
      label: "Total Faturado",
      value: fmtCurrency(totalPago),
      sub: `${countPago} pagamentos`,
      desc: "Soma dos pagamentos com status pago",
      icon: DollarSign,
      color: "text-[hsl(var(--success))]",
      bg: "bg-[hsl(var(--success))]/10",
    },
    {
      label: "Pendente",
      value: fmtCurrency(totalPendente),
      sub: `${countPendente} cobranças`,
      desc: "Cobranças geradas ainda não pagas",
      icon: Clock,
      color: "text-[hsl(var(--warning))]",
      bg: "bg-[hsl(var(--warning))]/10",
    },
    {
      label: "Cancelado",
      value: fmtCurrency(totalCancelado),
      sub: "Valor perdido",
      desc: "Receita estimada de atendimentos cancelados",
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Ticket Médio",
      value: fmtCurrency(countPago > 0 ? totalPago / countPago : 0),
      sub: `${countTotal} atendimentos`,
      desc: "Média por pagamento aprovado",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
          <p className="text-lg font-semibold tabular-nums">{c.value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</p>
          <p className="text-[10px] text-muted-foreground/70 italic mt-0.5">{c.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default FaturamentoKPIs;

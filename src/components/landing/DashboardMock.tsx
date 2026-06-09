import { forwardRef } from "react";
import {
  LayoutDashboard, DollarSign, Calendar, Users,
  TrendingUp, UserX, ChevronRight,
} from "lucide-react";
import logoColor from "@/assets/logo-color.png";

/* ── mini SVG area chart ── */
function AreaSparkline({ color }: { color: string }) {
  const pts = [18, 32, 28, 45, 38, 60, 52, 72, 65, 88, 78, 96];
  const h = 72;
  const w = 220;
  const step = w / (pts.length - 1);
  const max = Math.max(...pts);
  const coords = pts.map((v, i) => [i * step, h - (v / max) * (h - 6)]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 72 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`ag-${color.replace(/[^a-z]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="hsl(var(--border))" strokeWidth="0.5" strokeOpacity="0.6" />
      ))}
      <path d={area} fill={`url(#ag-${color.replace(/[^a-z]/gi, "")})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── mini bar chart ── */
function BarSparkline({ color }: { color: string }) {
  const vals = [4, 7, 5, 9, 8, 11, 6, 14, 10, 12, 9, 15];
  const max = Math.max(...vals);
  const h = 72;
  const barW = 12;
  const gap = 4;
  const total = vals.length * (barW + gap) - gap;
  const offsetX = (220 - total) / 2;
  return (
    <svg viewBox={`0 0 220 ${h}`} className="w-full" style={{ height: 72 }} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1="0" y1={h * f} x2="220" y2={h * f} stroke="hsl(var(--border))" strokeWidth="0.5" strokeOpacity="0.6" />
      ))}
      {vals.map((v, i) => {
        const barH = (v / max) * (h - 6);
        const x = offsetX + i * (barW + gap);
        const y = h - barH;
        return (
          <rect key={i} x={x} y={y} width={barW} height={barH} rx="2" fill={color} fillOpacity={i === vals.length - 1 ? 1 : 0.28} />
        );
      })}
    </svg>
  );
}

/* ── KPI card ── */
function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-white p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider leading-tight">{label}</span>
        <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
          <Icon size={10} style={{ color }} />
        </div>
      </div>
      <div className="text-base font-light text-foreground leading-none">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground leading-tight">{sub}</div>}
    </div>
  );
}

/* ── today appointment row ── */
const todayAppts = [
  { time: "09:00", client: "Camila F.", service: "Limpeza de Pele", status: "Feito" },
  { time: "10:30", client: "Juliana M.", service: "Design de Sobrancelha", status: "Confirmado" },
  { time: "11:30", client: "Fernanda R.", service: "Tratamento Facial", status: "Agendado" },
  { time: "14:00", client: "Patricia L.", service: "Massagem Relaxante", status: "Agendado" },
  { time: "15:30", client: "Andrea C.", service: "Peeling Químico", status: "Agendado" },
];

const statusColor: Record<string, string> = {
  "Feito": "bg-emerald-100 text-emerald-700",
  "Confirmado": "bg-primary/10 text-primary",
  "Agendado": "bg-muted text-muted-foreground",
};

/* ── specialist bars ── */
const specialists = [
  { name: "Dra. Ana Silva", revenue: "R$ 7.420", pct: 100, color: "hsl(10 75% 65%)" },
  { name: "Bianca Santos", revenue: "R$ 5.810", pct: 78, color: "hsl(210 80% 60%)" },
  { name: "Dr. Felipe M.", revenue: "R$ 3.190", pct: 43, color: "hsl(262 80% 60%)" },
];

const PRIMARY = "hsl(10 75% 65%)";

const DashboardMock = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div
      ref={ref}
      className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-border shadow-[0_32px_80px_hsl(20_15%_12%/0.12)]"
      style={{ background: "hsl(30 25% 99%)" }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border" style={{ background: "hsl(30 20% 97%)" }}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div className="flex-1 mx-4">
          <div className="w-44 h-4 mx-auto rounded bg-border/60 flex items-center justify-center">
            <span className="text-[9px] text-muted-foreground">app.bellex.com.br</span>
          </div>
        </div>
      </div>

      <div className="flex" style={{ height: 540 }}>
        {/* Sidebar */}
        <div className="w-12 border-r border-border flex flex-col items-center py-4 gap-4 flex-shrink-0" style={{ background: "hsl(30 20% 97%)" }}>
          <img src={logoColor} alt="Bellex" className="w-7 h-auto opacity-90 mb-1" />
          {[LayoutDashboard, Calendar, Users, DollarSign, TrendingUp].map((Icon, i) => (
            <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${i === 0 ? "bg-primary/15" : "hover:bg-border/60"}`}>
              <Icon size={14} className={i === 0 ? "text-primary" : "text-muted-foreground"} />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden px-5 py-4 gap-4">

          {/* Page header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${PRIMARY}22` }}>
                <LayoutDashboard size={14} style={{ color: PRIMARY }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">Dashboard</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Visão geral da clínica</p>
              </div>
            </div>
            <div className="text-[10px] border border-border px-2.5 py-1 rounded-lg text-muted-foreground bg-white">
              Últimos 30 dias
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-5 gap-2.5">
            <KpiCard icon={DollarSign} label="Faturamento do mês" value="R$ 18.420" sub="Últimos 30d: R$ 54k" color="hsl(142 70% 45%)" />
            <KpiCard icon={Calendar} label="Atendimentos" value="86" sub="Últimos 30d: 241" color={PRIMARY} />
            <KpiCard icon={Users} label="Clientes ativos" value="312" sub="418 total" color="hsl(210 80% 60%)" />
            <KpiCard icon={TrendingUp} label="Ticket médio" value="R$ 214" color="hsl(262 80% 60%)" />
            <KpiCard icon={UserX} label="Não comparecimento" value="3%" sub="2 cancelamentos" color="hsl(0 70% 55%)" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            {/* Revenue area chart */}
            <div className="rounded-xl border border-border/50 bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[11px] font-medium text-foreground">Faturamento</p>
                  <p className="text-[9px] text-muted-foreground">Últimos 30 dias</p>
                </div>
                <button className="flex items-center gap-0.5 text-[9px] text-primary">
                  Ver faturamento <ChevronRight size={9} />
                </button>
              </div>
              <AreaSparkline color={PRIMARY} />
            </div>

            {/* Appointments bar chart */}
            <div className="rounded-xl border border-border/50 bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[11px] font-medium text-foreground">Atendimentos</p>
                  <p className="text-[9px] text-muted-foreground">Últimos 30 dias</p>
                </div>
                <button className="flex items-center gap-0.5 text-[9px] text-primary">
                  Ver agenda <ChevronRight size={9} />
                </button>
              </div>
              <BarSparkline color={PRIMARY} />
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            {/* Today */}
            <div className="rounded-xl border border-border/50 bg-white p-3 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[11px] font-medium text-foreground">Agenda de hoje</p>
                  <p className="text-[9px] text-muted-foreground">segunda-feira, 09 de junho</p>
                </div>
                <button className="flex items-center gap-0.5 text-[9px] text-primary">
                  Abrir agenda <ChevronRight size={9} />
                </button>
              </div>
              <div className="space-y-1.5 overflow-hidden flex-1">
                {todayAppts.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-[9px] text-muted-foreground w-9 flex-shrink-0">{a.time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-foreground truncate">{a.client}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{a.service}</p>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor[a.status]}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per specialist */}
            <div className="rounded-xl border border-border/50 bg-white p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[11px] font-medium text-foreground">Por especialista</p>
                  <p className="text-[9px] text-muted-foreground">Faturamento total</p>
                </div>
                <button className="flex items-center gap-0.5 text-[9px] text-primary">
                  Ver relatórios <ChevronRight size={9} />
                </button>
              </div>
              <div className="space-y-3 flex-1">
                {specialists.map((s) => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-foreground font-medium truncate max-w-[55%]">{s.name}</span>
                      <span className="text-muted-foreground">{s.revenue}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

DashboardMock.displayName = "DashboardMock";
export default DashboardMock;

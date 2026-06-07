import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell,
} from "recharts";

const monthlyData = [
  { month: "Jan", revenue: 32000, patients: 45 },
  { month: "Fev", revenue: 38000, patients: 52 },
  { month: "Mar", revenue: 42000, patients: 58 },
  { month: "Abr", revenue: 35000, patients: 48 },
  { month: "Mai", revenue: 48500, patients: 65 },
  { month: "Jun", revenue: 52000, patients: 72 },
];

const sparkNeutro = [5, 6, 5, 6, 5, 5, 6, 5, 6, 5].map((v, i) => ({ i, v }));
const sparkBom = [3, 4, 5, 6, 7, 7, 8, 9, 10, 12].map((v, i) => ({ i, v }));
const sparkRuim = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3].map((v, i) => ({ i, v }));

export const DSCharts = () => {
  const [animKey, setAnimKey] = useState(0);

  const replayAnimations = () => setAnimKey((k) => k + 1);

  return (
    <section className="ds-section border-t border-border">
      <span className="text-xs text-primary tracking-widest uppercase font-medium">08</span>
      <h2 className="ds-section-title mt-2">Sistema de Gráficos</h2>
      <p className="ds-section-subtitle">Visualizações de dados elegantes com Recharts, alinhadas à paleta da marca.</p>

      {/* Specs */}
      <div className="ds-card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-light uppercase tracking-wider">Especificações</h3>
          <button
            onClick={replayAnimations}
            className="text-xs text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
          >
            ▶ Replay animações
          </button>
        </div>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Biblioteca</p>
            <p className="font-medium">Recharts</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Espessura de Linha</p>
            <p className="font-medium">2px (strokeWidth: 2)</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Animação de Entrada</p>
            <p className="font-medium">ease-out, 1200ms</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Animação de Barra</p>
            <p className="font-medium">ease-out, 800ms staggered</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Cores do Gráfico</p>
          <div className="flex gap-3">
            {[
              { label: "Primary", cls: "bg-primary" },
              { label: "Accent", cls: "bg-accent" },
              { label: "Success", cls: "bg-success" },
              { label: "Info", cls: "bg-info" },
              { label: "Muted", cls: "bg-muted" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${c.cls}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area Chart with animation */}
      <h3 className="font-heading font-light uppercase tracking-wider mb-4">Gráfico de Linha / Área</h3>
      <div className="ds-card mb-8">
        <p className="text-sm text-muted-foreground mb-4">Faturamento Mensal (€) — animação <code className="ds-code">ease-out 1200ms</code></p>
        <ResponsiveContainer width="100%" height={250} key={`area-${animKey}`}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(30, 12%, 65%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(30, 12%, 65%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(40, 20%, 99%)",
                border: "1px solid hsl(30, 15%, 88%)",
                borderRadius: 8,
                fontSize: 12,
                boxShadow: "0 4px 12px hsl(30 12% 65% / 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(30, 12%, 65%)"
              strokeWidth={2}
              fill="url(#gradientPrimary)"
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart with staggered animation */}
      <h3 className="font-heading font-light uppercase tracking-wider mb-4">Gráfico de Barras</h3>
      <div className="ds-card mb-8">
        <p className="text-sm text-muted-foreground mb-4">Pacientes Atendidos — animação <code className="ds-code">staggered 800ms</code></p>
        <ResponsiveContainer width="100%" height={200} key={`bar-${animKey}`}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(40, 20%, 99%)",
                border: "1px solid hsl(30, 15%, 88%)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="patients"
              fill="hsl(36, 40%, 62%)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
              animationBegin={400}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dual-axis comparison */}
      <h3 className="font-heading font-light uppercase tracking-wider mb-4">Gráfico Combinado (Barras + Linha)</h3>
      <div className="ds-card mb-8">
        <p className="text-sm text-muted-foreground mb-4">Receita vs Pacientes — animação sequencial</p>
        <ResponsiveContainer width="100%" height={250} key={`combo-${animKey}`}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "hsl(30, 8%, 50%)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(40, 20%, 99%)",
                border: "1px solid hsl(30, 15%, 88%)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="hsl(30, 12%, 65%)"
              radius={[4, 4, 0, 0]}
              opacity={0.6}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
              animationBegin={200}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="patients"
              stroke="hsl(36, 40%, 62%)"
              strokeWidth={2}
              dot={{ r: 4, fill: "hsl(36, 40%, 62%)" }}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sparklines */}
      <h3 className="font-heading font-light uppercase tracking-wider mb-4">Sparkline (para tabelas)</h3>
      <div className="ds-card">
        <div className="space-y-4">
          {[
            { label: "Estável", desc: "Sem variação significativa", data: sparkNeutro, color: "hsl(30, 8%, 50%)", badge: "Neutro", badgeCls: "bg-muted text-muted-foreground" },
            { label: "Crescimento", desc: "Tendência positiva", data: sparkBom, color: "hsl(150, 25%, 45%)", badge: "Bom", badgeCls: "bg-success/15 text-success" },
            { label: "Queda", desc: "Tendência negativa", data: sparkRuim, color: "hsl(0, 45%, 55%)", badge: "Ruim", badgeCls: "bg-destructive/15 text-destructive" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-6">
              <div className="w-24">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className="w-32 h-8" key={`spark-${item.label}-${animKey}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={item.data}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={item.color}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={600}
                      animationEasing="ease-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className={`ds-badge text-[10px] ${item.badgeCls}`}>{item.badge}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">Sem eixos, sem grid. Apenas a linha com strokeWidth 1.5px. Ideal para métricas inline.</p>
      </div>
    </section>
  );
};

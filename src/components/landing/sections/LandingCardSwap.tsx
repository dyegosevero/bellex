import { useRef, useState } from "react";
import CardSwap, { Card, CardSwapHandle } from "@/components/ui/card-swap";
import { Calendar, Users, CreditCard, Megaphone, BarChart3, Globe } from "lucide-react";
import { FadeUp } from "./utils";

const screens = [
  {
    icon: Calendar,
    label: "Agenda Inteligente",
    color: "hsl(10 75% 77%)",
    bg: "hsl(10 60% 96%)",
    preview: (
      <div className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Segunda, 02 Jun</span>
          <div className="flex gap-1">
            {["Dr. Ana", "Dr. Felipe", "Bianca"].map((s) => (
              <span key={s} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
        {[
          { time: "09:00", client: "Maria S.", service: "Limpeza de Pele", color: "bg-primary/15", specialist: "Dr. Ana" },
          { time: "10:30", client: "Juliana P.", service: "Peeling Químico", color: "bg-amber-100", specialist: "Dr. Felipe" },
          { time: "11:30", client: "Carolina M.", service: "Botox", color: "bg-primary/15", specialist: "Dr. Ana" },
          { time: "14:00", client: "Andrea C.", service: "Laser CO₂", color: "bg-emerald-100", specialist: "Bianca" },
          { time: "15:30", client: "Fernanda L.", service: "Microagulhamento", color: "bg-amber-100", specialist: "Dr. Felipe" },
          { time: "17:00", client: "Tatiane R.", service: "Preenchimento", color: "bg-primary/15", specialist: "Dr. Ana" },
        ].map((appt) => (
          <div key={appt.time} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${appt.color}`}>
            <span className="text-xs font-medium text-foreground/60 w-10 shrink-0">{appt.time}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{appt.client}</p>
              <p className="text-[11px] text-muted-foreground truncate">{appt.service}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{appt.specialist}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Users,
    label: "Gestão de Clientes",
    color: "hsl(210 80% 60%)",
    bg: "hsl(210 60% 97%)",
    preview: (
      <div className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Maria Silva · Prontuário</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Ativa</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Atendimentos", value: "24" },
            { label: "Último retorno", value: "12 dias" },
            { label: "Total gasto", value: "R$ 3.840" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-muted/40 px-3 py-2 text-center">
              <p className="text-base font-light text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border/40 px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Última anamnese</p>
          {["Pele mista com tendência oleosa", "Alergia: parabenos", "Objetivo: redução de manchas"].map((item) => (
            <p key={item} className="text-xs text-foreground flex gap-2"><span className="text-primary">›</span>{item}</p>
          ))}
        </div>
        <div className="rounded-xl border border-border/40 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Histórico recente</p>
          {[
            { date: "20/05", service: "Peeling Químico" },
            { date: "08/05", service: "Limpeza de Pele" },
            { date: "22/04", service: "Microagulhamento" },
          ].map((h) => (
            <div key={h.date} className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">{h.date}</span>
              <span className="text-foreground">{h.service}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: CreditCard,
    label: "Cobranças & Faturamento",
    color: "hsl(142 70% 45%)",
    bg: "hsl(142 50% 96%)",
    preview: (
      <div className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Junho 2026</span>
          <span className="text-[10px] text-muted-foreground">Atualizado agora</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Faturamento", value: "R$ 28.450", trend: "+18%" },
            { label: "Recebido", value: "R$ 24.200", trend: "+12%" },
            { label: "Em aberto", value: "R$ 4.250", trend: "-3%" },
            { label: "Ticket médio", value: "R$ 187", trend: "+7%" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-muted/40 px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
              <p className="text-sm font-medium text-foreground">{s.value}</p>
              <p className="text-[10px] text-emerald-600">{s.trend} vs mês anterior</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border/40 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Top serviços</p>
          {[
            { name: "Botox", value: "R$ 8.400", pct: 82 },
            { name: "Peeling Químico", value: "R$ 5.200", pct: 58 },
            { name: "Laser CO₂", value: "R$ 4.800", pct: 52 },
          ].map((s) => (
            <div key={s.name} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground">{s.name}</span>
                <span className="text-muted-foreground">{s.value}</span>
              </div>
              <div className="h-1 bg-muted rounded-full">
                <div className="h-1 bg-primary rounded-full" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Megaphone,
    label: "Marketing Automatizado",
    color: "hsl(30 90% 55%)",
    bg: "hsl(30 80% 96%)",
    preview: (
      <div className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Automações ativas</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">3 rodando</span>
        </div>
        {[
          { name: "Reativação 60 dias", sent: 142, returned: 38, rate: "27%", status: "Ativa" },
          { name: "Avaliação Google pós-atend.", sent: 890, returned: 312, rate: "35%", status: "Ativa" },
          { name: "Campanha Dia das Mães", sent: 560, returned: 91, rate: "16%", status: "Concluída" },
        ].map((c) => (
          <div key={c.name} className="rounded-xl border border-border/40 px-4 py-3">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-foreground">{c.name}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === "Ativa" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{c.status}</span>
            </div>
            <div className="flex gap-4 text-[11px] text-muted-foreground">
              <span>Enviado: <b className="text-foreground">{c.sent}</b></span>
              <span>Retorno: <b className="text-foreground">{c.returned}</b></span>
              <span>Taxa: <b className="text-primary">{c.rate}</b></span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: BarChart3,
    label: "Relatórios Gerenciais",
    color: "hsl(262 80% 60%)",
    bg: "hsl(262 60% 97%)",
    preview: (
      <div className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Relatório Executivo</span>
          <span className="text-[10px] text-muted-foreground">Jun 2026</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Novos clientes", value: "47", change: "+12" },
            { label: "Taxa de retorno", value: "68%", change: "+5%" },
            { label: "NPS médio", value: "9.2", change: "+0.3" },
            { label: "Ocupação", value: "84%", change: "+9%" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-muted/40 px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-base font-light text-foreground">{s.value}</p>
              <p className="text-[10px] text-emerald-600">↑ {s.change}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border/40 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Por especialista</p>
          {[
            { name: "Dr. Ana", appts: 94, revenue: "R$ 11.200", pct: 88 },
            { name: "Dr. Felipe", appts: 78, revenue: "R$ 9.400", pct: 72 },
            { name: "Bianca S.", appts: 61, revenue: "R$ 7.850", pct: 58 },
          ].map((e) => (
            <div key={e.name} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground">{e.name} · {e.appts} atend.</span>
                <span className="text-muted-foreground">{e.revenue}</span>
              </div>
              <div className="h-1 bg-muted rounded-full">
                <div className="h-1 bg-violet-400 rounded-full" style={{ width: `${e.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Globe,
    label: "Agendamento Online",
    color: "hsl(195 80% 50%)",
    bg: "hsl(195 60% 96%)",
    preview: (
      <div className="p-5 h-full flex flex-col gap-3">
        <div className="rounded-xl border border-border/40 px-4 py-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Link público da clínica</p>
          <p className="text-xs font-medium text-primary">agendamento.suaclinica.com.br</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Escolha o serviço</p>
          {["Limpeza de Pele · 60min · R$ 180", "Peeling Químico · 45min · R$ 250", "Botox · 30min · R$ 450"].map((s) => (
            <div key={s} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <span className="text-xs text-foreground">{s.split(" · ")[0]}</span>
              <span className="text-xs text-primary font-medium">{s.split(" · ")[2]}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Horários disponíveis — Hoje</p>
          <div className="grid grid-cols-4 gap-1.5">
            {["09:00", "10:30", "14:00", "15:30", "16:00", "17:30", "18:00", "19:00"].map((t) => (
              <div key={t} className="rounded-lg bg-background border border-border/50 py-1.5 text-center text-[11px] text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">{t}</div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

export function LandingCardSwap() {
  const cardSwapRef = useRef<CardSwapHandle>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-20 md:py-32 bg-background overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid md:grid-cols-2 gap-0 items-start">
          {/* Left — copy */}
          <FadeUp>
            <p className="text-xs text-primary tracking-widest uppercase font-medium mb-5">O sistema completo</p>
            <h2 className="text-4xl md:text-5xl font-light leading-snug text-foreground mb-5">
              Cada tela foi pensada{" "}
              <span className="text-primary">para a rotina da clínica.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Agenda, clientes, faturamento, marketing, relatórios e agendamento online — tudo integrado, sem exportar, sem copiar, sem colar.
            </p>
            <div className="space-y-0">
              {screens.map((s, i) => {
                const isActive = activeIndex === i;
                return (
                  <button
                    key={s.label}
                    onClick={() => {
                      setActiveIndex(i);
                      cardSwapRef.current?.jumpTo(i);
                    }}
                    className="flex items-center gap-3 w-full text-left py-2.5 select-none group"
                  >
                    <s.icon
                      size={14}
                      className="shrink-0 transition-colors duration-200"
                      style={{ color: isActive ? s.color : "hsl(var(--muted-foreground))" }}
                    />
                    <span
                      className="text-sm transition-colors duration-200"
                      style={{
                        color: isActive ? s.color : "hsl(var(--foreground))",
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {s.label}
                    </span>
                    <svg
                      className="ml-auto w-3 h-3 transition-all duration-200"
                      style={{
                        color: isActive ? s.color : "hsl(var(--muted-foreground) / 0.3)",
                        transform: isActive ? "translateX(2px)" : undefined,
                      }}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          </FadeUp>

          {/* Right — CardSwap */}
          <div className="relative h-[520px] hidden md:block">
            <CardSwap
              ref={cardSwapRef}
              width={400}
              height={420}
              cardDistance={55}
              verticalDistance={65}
              delay={2600}
              pauseOnHover
              skewAmount={5}
              easing="elastic"
              onActiveChange={setActiveIndex}
            >
              {screens.map((s) => (
                <Card key={s.label} customClass="p-0" style={{ background: "#fff" }}>
                  {/* Card header */}
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40" style={{ background: s.bg }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${s.color}1a` }}>
                      <s.icon size={12} style={{ color: s.color }} />
                    </div>
                    <span className="text-xs font-semibold tracking-wide text-foreground">{s.label}</span>
                    <div className="ml-auto flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-border/60" />
                      <div className="w-2 h-2 rounded-full bg-border/60" />
                      <div className="w-2 h-2 rounded-full bg-border/60" />
                    </div>
                  </div>
                  {/* Preview content */}
                  <div className="overflow-hidden" style={{ height: "calc(100% - 49px)" }}>
                    {s.preview}
                  </div>
                </Card>
              ))}
            </CardSwap>
          </div>
        </div>
      </div>
    </section>
  );
}

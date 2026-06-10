import { Link } from "react-router-dom";
import { Calendar, Users, CreditCard, Megaphone, BarChart3, Globe, ArrowRight } from "lucide-react";

const RESOURCES = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    desc: "Calendário visual com bloqueios automáticos, lembretes por WhatsApp e visão por especialista. Nunca mais conflito de horário.",
    href: "/recursos/agenda",
    color: "#e8957a",
    tag: "Mais usado",
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    desc: "Ficha completa com anamnese, histórico de procedimentos, fotos antes/depois e evolução do tratamento.",
    href: "/recursos/clientes",
    color: "#a78bfa",
    tag: null,
  },
  {
    icon: CreditCard,
    title: "Financeiro & Cobranças",
    desc: "Controle de receita, inadimplência e faturamento por período. Saiba exatamente onde está seu dinheiro.",
    href: "/recursos/financeiro",
    color: "#34d399",
    tag: null,
  },
  {
    icon: Megaphone,
    title: "Marketing Automatizado",
    desc: "Reative clientes inativos, envie campanhas segmentadas e colete avaliações no Google — sem esforço manual.",
    href: "/recursos/marketing",
    color: "#f5c87a",
    tag: null,
  },
  {
    icon: BarChart3,
    title: "Relatórios & Insights",
    desc: "Produtividade por especialista, taxa de retorno e serviços mais rentáveis. Dados para decidir, não para enfeitar.",
    href: "/recursos/relatorios",
    color: "#60a5fa",
    tag: null,
  },
  {
    icon: Globe,
    title: "Agendamento Online 24h",
    desc: "Link público com seus serviços e horários disponíveis. O cliente agenda sozinho — a qualquer hora do dia.",
    href: "/recursos/agendamento-online",
    color: "#fb923c",
    tag: "Novidade",
  },
];

export function LandingResources() {
  return (
    <section className="py-16 md:py-28 bg-background">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-xl space-y-3 text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Funcionalidades</p>
          <h2 className="text-balance text-3xl md:text-4xl font-medium">Explore cada recurso em detalhe</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Cada módulo foi desenhado para resolver um problema real da rotina da clínica — e funciona em conjunto com todos os outros.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RESOURCES.map((r) => (
            <Link
              key={r.href}
              to={r.href}
              className="group relative rounded-2xl border border-border/40 bg-card p-5 hover:shadow-md hover:border-border/70 transition-all duration-200 flex flex-col gap-4"
            >
              {/* Tag */}
              {r.tag && (
                <span
                  className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${r.color}22`, color: r.color }}
                >
                  {r.tag}
                </span>
              )}

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${r.color}18` }}
              >
                <r.icon className="w-5 h-5" style={{ color: r.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1.5">
                <h3 className="font-semibold text-sm leading-snug">{r.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>

              {/* CTA */}
              <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalhes <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>

        {/* Bottom link */}
        <div className="mt-10 text-center">
          <Link
            to="/recursos/agenda"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todos os recursos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

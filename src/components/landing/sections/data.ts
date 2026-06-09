import { Calendar, Users, CreditCard, Megaphone, BarChart3, Globe, AlertCircle, Lightbulb } from "lucide-react";

export const features = [
  { icon: Calendar, title: "Agenda Inteligente", desc: "Calendário visual com bloqueios, lembretes automáticos por WhatsApp e e-mail, e visão por especialista. Zero confusão de horário.", href: "/recursos/agenda" },
  { icon: Users, title: "Gestão de Clientes", desc: "Ficha completa de cada cliente: anamnese, histórico de procedimentos, fotos antes/depois e evolução do tratamento.", href: "/recursos/clientes" },
  { icon: CreditCard, title: "Cobranças & Faturamento", desc: "Cobranças, inadimplência, faturamento por período e exportação para a contabilidade. Saiba exatamente onde está sua receita.", href: "/recursos/financeiro" },
  { icon: Megaphone, title: "Marketing Automatizado", desc: "Reative clientes inativos, envie campanhas segmentadas e colete avaliações no Google — tudo sem esforço manual.", href: "/recursos/marketing" },
  { icon: BarChart3, title: "Relatórios Reais", desc: "Produtividade por especialista, taxa de retorno, serviços mais rentáveis. Dados para decidir, não para enfeitar.", href: "/recursos/relatorios" },
  { icon: Globe, title: "Agendamento 24h", desc: "Link público com seus serviços, especialistas e horários disponíveis. O cliente agenda sozinho — a qualquer hora.", href: "/recursos/agendamento-online" },
];

export const problems = [
  { icon: AlertCircle, text: "Agenda no caderno ou em vários aplicativos ao mesmo tempo" },
  { icon: AlertCircle, text: "Clientes que somem sem retornar nunca mais" },
  { icon: AlertCircle, text: "Não sabe exatamente quanto faturou no mês" },
  { icon: AlertCircle, text: "Perde horas por semana em tarefas que deveriam ser automáticas" },
];

export const solutions = [
  { icon: Lightbulb, text: "Tudo centralizado: agenda, clientes, financeiro e marketing" },
  { icon: Lightbulb, text: "Reativação automática de quem não volta há 60, 90 ou 120 dias" },
  { icon: Lightbulb, text: "Relatório financeiro atualizado em tempo real, sem planilha" },
  { icon: Lightbulb, text: "Lembretes, cobranças e avaliações disparados automaticamente" },
];

export const stats = [
  { value: 500, suffix: "+", label: "Clínicas ativas" },
  { value: 98, suffix: "%", label: "Satisfação" },
  { value: 40, suffix: "h", label: "Economizadas/mês" },
  { value: 35, suffix: "%", label: "Mais faturamento" },
];

export const testimonials = [
  { quote: "Antes eu perdia 2 horas por dia só organizando agenda e cobrando clientes. Hoje é automático. Minha equipe dobrou sem eu me perder na gestão.", name: "Camila Ferreira", role: "Studio CF Estética", initials: "CF" },
  { quote: "O prontuário digital mudou meu atendimento. Tenho o histórico completo de cada cliente antes mesmo da consulta começar.", name: "Dra. Mariana Souza", role: "Dermatologista, Clínica MS", initials: "MS" },
  { quote: "O link de agendamento online foi um divisor de águas. Clientes agendam à meia-noite. Minha ocupação subiu 40% em dois meses.", name: "Paulo Henriques", role: "Fisioterapeuta, Studio PH", initials: "PH" },
];

export const plans = [
  {
    name: "Starter",
    price: { monthly: "R$ 129", annual: "R$ 90" },
    period: "/mês",
    annualNote: "R$ 1.080 cobrados anualmente",
    desc: "Para clínicas que estão começando.",
    features: [
      "Até 2 especialistas",
      "Agenda + Gestão de Clientes",
      "Agendamento online 24h",
      "Lembretes por WhatsApp",
      "Controle financeiro básico",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: { monthly: "R$ 249", annual: "R$ 174" },
    period: "/mês",
    annualNote: "R$ 2.088 cobrados anualmente",
    desc: "Para clínicas em crescimento.",
    features: [
      "Especialistas ilimitados",
      "Tudo do Starter",
      "Cobranças & faturamento completo",
      "Marketing automatizado",
      "Relatórios por especialista",
      "App com seu logo",
      "Suporte prioritário (chat + telefone)",
    ],
    cta: "Começar grátis",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: { monthly: "Sob consulta", annual: "Sob consulta" },
    period: "",
    annualNote: "",
    desc: "Para redes e franquias.",
    features: [
      "Multi-unidade",
      "Tudo do Pro",
      "Whitelabel completo",
      "Onboarding dedicado",
      "SLA garantido",
      "Integrações customizadas",
    ],
    cta: "Falar com a equipe",
    highlighted: false,
  },
];

export type CompareRow = {
  label: string;
  starter: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
};

export const compareRows: CompareRow[] = [
  { label: "Especialistas", starter: "Até 2", pro: "Ilimitados", enterprise: "Ilimitados" },
  { label: "Agendamento online 24h", starter: true, pro: true, enterprise: true },
  { label: "Gestão de Clientes", starter: true, pro: true, enterprise: true },
  { label: "Lembretes por WhatsApp", starter: "50/mês", pro: "Ilimitado", enterprise: "Ilimitado" },
  { label: "Cobranças & Faturamento", starter: "Básico", pro: "Completo", enterprise: "Completo" },
  { label: "Marketing automatizado", starter: false, pro: true, enterprise: true },
  { label: "Relatórios gerenciais", starter: false, pro: true, enterprise: true },
  { label: "App com seu logo", starter: false, pro: true, enterprise: true },
  { label: "Multi-unidade", starter: false, pro: false, enterprise: true },
  { label: "Onboarding dedicado", starter: false, pro: false, enterprise: true },
  { label: "Suporte", starter: "E-mail", pro: "Chat + telefone", enterprise: "SLA garantido" },
];

export const faqs = [
  { q: "Preciso instalar algum software?", a: "Não. A Bellex roda 100% no navegador — funciona em qualquer dispositivo, sem instalação." },
  { q: "Consigo migrar meus dados do sistema atual?", a: "Sim. Nossa equipe faz a migração gratuitamente e acompanha você na configuração inicial." },
  { q: "Quantos especialistas posso cadastrar?", a: "No plano Starter até 2. No Pro e Enterprise, ilimitado — sem custo adicional por especialista." },
  { q: "Como funciona a demo?", a: "Você agenda uma conversa com nossa equipe. Mostramos o sistema completo funcionando com dados reais do seu segmento — sem script genérico, sem enrolação." },
  { q: "Os dados ficam seguros?", a: "Sim. Seguimos LGPD, criptografia AES-256, backups diários e uptime de 99,9%. Seus dados nunca são compartilhados." },
];

import { RecursoLayout } from "@/components/landing/RecursoLayout";
import { Calendar, Clock, Bell, Users, Lock, ArrowRight } from "lucide-react";

export default function RecursoAgenda() {
  return (
    <RecursoLayout content={{
      icon: Calendar,
      label: "Agenda",
      heroTitle: "Sua agenda vive em caderno, WhatsApp e achismo.",
      heroDesc: "Horários marcados em três lugares diferentes, confirmações que não chegam, no-shows que custam dinheiro. Existe uma forma melhor.",

      problemTitle: "Você começa o dia sem saber exatamente o que vai acontecer.",
      problemSubtitle: "Sem visibilidade da agenda, você reage. Com a Bellex, você antecipa — e a clínica para de perder dinheiro por desorganização.",
      pains: [
        "Cliente esqueceu o horário e você só descobriu quando ele não apareceu",
        "Dois atendimentos marcados no mesmo horário com a mesma especialista",
        "Confirmação por WhatsApp que nunca tem resposta ou some na conversa",
        "Não sabe qual especialista tem horário livre sem ligar pra ela",
        "Feriados e folgas não estão bloqueados — cliente agenda e você cancela na hora",
      ],
      amplifyQuote: "Cada no-show é dinheiro perdido que não volta. Você pagou para ter aquela sala disponível, aquela especialista pronta — e ninguém apareceu porque ninguém lembrou.",

      solutionTitle: "Agenda visual completa, com tudo que a sua clínica precisa.",
      solutionDesc: "Cada horário, cada especialista, cada confirmação — organizados num único lugar. Sem papel, sem WhatsApp, sem susto.",
      features: [
        { icon: Calendar, title: "Calendário visual completo", desc: "Grade diária e semanal. Veja todos os atendimentos de uma vez, por especialista ou por sala." },
        { icon: Users, title: "Agenda por especialista", desc: "Filtre, compare e gerencie disponibilidade de toda a equipe sem precisar perguntar para ninguém." },
        { icon: Bell, title: "Lembretes automáticos", desc: "WhatsApp, SMS e e-mail disparados antes do atendimento. No-show cai mais de 60%." },
        { icon: Clock, title: "Bloqueios e horários", desc: "Folgas, feriados e intervalos configurados uma vez. Nunca mais agenda em horário errado." },
        { icon: Lock, title: "Confirmação online", desc: "O cliente confirma ou cancela pelo link. Você é notificado e o horário fica disponível automaticamente." },
        { icon: ArrowRight, title: "Criação em segundos", desc: "Clique no horário livre e crie o agendamento. Menos de 30 segundos do zero ao confirmado." },
      ],

      transformTitle: "Uma agenda organizada muda o dia inteiro da sua clínica.",
      results: [
        { value: "60%", label: "Menos no-shows" },
        { value: "2h", label: "Economizadas por dia" },
        { value: "Zero", label: "Conflitos de horário" },
        { value: "100%", label: "Visibilidade da equipe" },
      ],

      ctaTitle: "Chega de começar o dia sem saber o que vai acontecer.",
      ctaDesc: "Nossa equipe configura sua agenda, importa seus dados e você começa a usar no dia combinado.",
    }} />
  );
}

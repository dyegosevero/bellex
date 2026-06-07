import { RecursoLayout } from "@/components/landing/RecursoLayout";
import { Globe, Clock, Smartphone, Link2, Bell, ArrowRight } from "lucide-react";

export default function RecursoAgendamentoOnline() {
  return (
    <RecursoLayout content={{
      icon: Globe,
      label: "Agendamento Online",
      heroTitle: "Seu WhatsApp não para de tocar com pedidos de agendamento.",
      heroDesc: "Cada mensagem de 'tem horário?' às 22h é um cliente que poderia ter agendado sozinho. Você não precisa estar disponível pra isso.",

      problemTitle: "Você é recepcionista da própria clínica. Sem querer.",
      problemSubtitle: "Cada confirmação manual, cada mensagem respondida fora do horário, cada horário negociado um por um — isso é energia que deveria ir para o atendimento.",
      pains: [
        "Clientes mandam mensagem no WhatsApp pessoal pedindo horário às 23h",
        "Você ou sua recepcionista passam horas por semana confirmando agendamentos manualmente",
        "Cliente não sabe quais especialistas têm disponibilidade — pergunta antes de agendar",
        "Horários em aberto que ficam vazios por falta de visibilidade pública",
        "Você perde clientes para concorrentes que têm agendamento online disponível",
      ],
      amplifyQuote: "O cliente que não consegue agendar fácil vai embora sem reclamar. Ele simplesmente abre o perfil do concorrente ao lado e clica em 'agendar'. Sem avisar, sem dar chance.",

      solutionTitle: "Sua agenda aberta 24h — sem você precisar estar lá.",
      solutionDesc: "Link público personalizado com seus serviços, especialistas e horários disponíveis. O cliente agenda, confirma e você só aparece na hora de atender.",
      features: [
        { icon: Globe, title: "Link público personalizado", desc: "Cada clínica tem seu link. Coloque no Instagram, WhatsApp e site — e pare de responder pedidos de horário." },
        { icon: Clock, title: "Disponível 24h por dia", desc: "Clientes agendam quando quiserem. Sábado à noite, domingo de manhã — sem depender de você." },
        { icon: Smartphone, title: "100% responsivo", desc: "Funciona em qualquer dispositivo sem instalar app. Simples o suficiente para qualquer cliente usar." },
        { icon: Bell, title: "Confirmação automática", desc: "Cliente recebe confirmação imediata por e-mail. Você é notificado na plataforma sem intervenção." },
        { icon: Link2, title: "Serviço, especialista e horário", desc: "O cliente escolhe tudo sozinho com base na disponibilidade real da sua agenda." },
        { icon: ArrowRight, title: "Cancelamento online", desc: "O cliente cancela pelo link. Horário liberado automaticamente para outro agendamento." },
      ],

      transformTitle: "Uma agenda que se preenche sem você intervir.",
      results: [
        { value: "24h", label: "Disponível para agendar" },
        { value: "90%", label: "Menos mensagens de agendamento" },
        { value: "Zero", label: "Confirmações manuais" },
        { value: "+15 dias", label: "Agenda cheia no primeiro mês" },
      ],

      ctaTitle: "Pare de ser recepcionista. Seja dono da clínica.",
      ctaDesc: "Nossa equipe configura seu link de agendamento e integra com sua agenda. Você começa a receber horários automáticos no mesmo dia.",
    }} />
  );
}

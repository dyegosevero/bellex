import { RecursoLayout } from "@/components/landing/RecursoLayout";
import { Megaphone, Mail, MessageSquare, Star, UserX, ArrowRight } from "lucide-react";

export default function RecursoMarketing() {
  return (
    <RecursoLayout content={{
      icon: Megaphone,
      label: "Marketing",
      heroTitle: "Sua clínica some da vida do cliente depois do atendimento.",
      heroDesc: "Clínicas que não fazem reativação perdem até 40% da receita todo mês. Seu cliente não voltou porque ninguém foi atrás dele.",

      problemTitle: "Você depende da memória do cliente para ele voltar.",
      problemSubtitle: "Sem comunicação ativa, você é esquecido. O concorrente que manda mensagem no momento certo leva o cliente que era seu.",
      pains: [
        "Você envia mensagem de cobrança ou retorno manualmente, um por um",
        "Não sabe quais clientes estão inativos há mais de 60 dias",
        "Não tem tempo de montar campanha — nem sabe por onde começar",
        "Pediu avaliação no Google alguma vez? Nunca conseguiu de forma sistemática",
        "Sua lista de clientes existe só pra contar, não pra gerar receita",
      ],
      amplifyQuote: "Você trabalhou meses pra conquistar esse cliente. Atendeu bem, cobrou certo. E ele simplesmente parou de vir — não porque foi embora, mas porque ninguém lembrou que ele existia.",

      solutionTitle: "Automação que trabalha enquanto você atende.",
      solutionDesc: "Configure uma vez. O sistema cuida do restante — reativação, campanhas, avaliações e lembretes — sem você precisar tocar.",
      features: [
        { icon: Mail, title: "Campanhas de e-mail", desc: "Editor visual com segmentação por serviço, data ou inatividade. Envio automático no melhor horário." },
        { icon: MessageSquare, title: "Campanhas de SMS", desc: "Taxa de abertura 5x maior que e-mail. Alcance clientes que não abrem mais o e-mail." },
        { icon: UserX, title: "Reativação de inativos", desc: "O sistema identifica clientes sem visita e dispara campanha personalizada automaticamente." },
        { icon: Star, title: "Avaliações no Google", desc: "Solicitação automática após cada atendimento. Sem constrangimento, sem esquecer." },
        { icon: Megaphone, title: "Histórico de campanhas", desc: "Envios, aberturas, cliques e conversões. Saiba o que está funcionando e o que não está." },
        { icon: ArrowRight, title: "Opt-out automático (LGPD)", desc: "Gestão de descadastro automática. Conformidade legal sem trabalho manual." },
      ],

      transformTitle: "O que acontece quando sua clínica para de ser esquecida.",
      results: [
        { value: "40%", label: "Mais receita recorrente" },
        { value: "3x", label: "Mais avaliações Google" },
        { value: "68%", label: "Taxa de abertura SMS" },
        { value: "14 dias", label: "Para ver primeiro retorno" },
      ],

      ctaTitle: "Sua lista de clientes vale dinheiro. Você só precisa usá-la.",
      ctaDesc: "Nossa equipe configura as automações pra você. Primeiro resultado aparece na primeira semana.",
    }} />
  );
}

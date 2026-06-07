import { RecursoLayout } from "@/components/landing/RecursoLayout";
import { BarChart3, TrendingUp, Users, Scissors, Package, ArrowRight } from "lucide-react";

export default function RecursoRelatorios() {
  return (
    <RecursoLayout content={{
      icon: BarChart3,
      label: "Relatórios",
      heroTitle: "Você toma decisões na clínica baseado em feeling. E isso custa caro.",
      heroDesc: "Sem dados, você chuta. Contrata a especialista errada, mantém serviço que não rentabiliza, investe onde não tem retorno.",

      problemTitle: "Você sabe o que aconteceu na clínica esta semana?",
      problemSubtitle: "Quanto faturou? Qual serviço mais vendeu? Qual especialista atendeu mais? Se você precisa pensar para responder, você não tem dados — você tem impressão.",
      pains: [
        "Não sabe qual serviço tem a melhor margem da clínica",
        "Não sabe se a nova especialista está gerando receita ou custo",
        "Prepara relatório manualmente em planilha toda vez que o contador pede",
        "Não tem visão de taxa de retorno — não sabe se os clientes voltam",
        "Tomou decisão de preço sem base nos números reais de custo e receita",
      ],
      amplifyQuote: "Você dirige sua clínica sem painel. Pode estar indo na direção certa, pode não estar. Sem dados, a diferença entre os dois é puro acaso.",

      solutionTitle: "Dados reais. Decisões inteligentes. Sem planilha.",
      solutionDesc: "Relatórios prontos para cada área da clínica — financeiro, clientes, especialistas, produtos e agendamentos.",
      features: [
        { icon: TrendingUp, title: "Relatório executivo", desc: "Visão geral de todos os indicadores — faturamento, atendimentos, clientes novos e retenção." },
        { icon: BarChart3, title: "Relatório financeiro", desc: "Receita por período, forma de pagamento e serviço. Exportação para Excel em um clique." },
        { icon: Users, title: "Relatório de clientes", desc: "Novos clientes, recorrentes, taxa de retenção e frequência de visitas." },
        { icon: Scissors, title: "Relatório por especialista", desc: "Produtividade, faturamento e atendimentos por profissional. Indispensável para gestão de comissões." },
        { icon: Package, title: "Relatório de produtos", desc: "Consumo por procedimento, produtos mais utilizados e controle de estoque." },
        { icon: ArrowRight, title: "Relatório de agendamentos", desc: "Taxa de confirmação, cancelamentos, no-shows e ocupação da agenda." },
      ],

      transformTitle: "O que muda quando você começa a decidir com dados.",
      results: [
        { value: "100%", label: "Visibilidade dos indicadores" },
        { value: "35%", label: "Mais faturamento em média" },
        { value: "Zero", label: "Relatórios manuais" },
        { value: "1 tela", label: "Para ver tudo" },
      ],

      ctaTitle: "Você merece saber o que realmente está acontecendo na sua clínica.",
      ctaDesc: "Nossa equipe configura os relatórios e você começa a tomar decisões com dados reais no mesmo dia.",
    }} />
  );
}

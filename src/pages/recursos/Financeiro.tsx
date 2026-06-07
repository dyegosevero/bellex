import { RecursoLayout } from "@/components/landing/RecursoLayout";
import { CreditCard, TrendingUp, AlertCircle, FileText, BarChart3, ArrowRight } from "lucide-react";

export default function RecursoFinanceiro() {
  return (
    <RecursoLayout content={{
      icon: CreditCard,
      label: "Financeiro",
      heroTitle: "Você não sabe exatamente quanto sua clínica faturou este mês.",
      heroDesc: "Receita chegando de formas diferentes, cobranças esquecidas, inadimplência sem controle. Você trabalha muito e não sabe se está ganhando.",

      problemTitle: "Sua clínica fatura bem. Mas o dinheiro some sem explicação.",
      problemSubtitle: "Sem controle financeiro real, você paga as contas no achismo e toma decisões com base em sentimento — não em dados.",
      pains: [
        "Não sabe quanto faturou em serviços versus produtos esse mês",
        "Tem clientes que devem há meses e você ainda não cobrou formalmente",
        "Não sabe qual especialista gera mais receita para a clínica",
        "Exportar dados para a contabilidade é um trabalho manual de horas",
        "Tomou uma decisão de investimento sem saber se tinha margem para isso",
      ],
      amplifyQuote: "A maioria das clínicas não fecha por falta de cliente. Fecha por falta de controle. Você pode estar faturando bem e sangrar por dentro sem perceber.",

      solutionTitle: "Controle financeiro real — não uma planilha glorificada.",
      solutionDesc: "Cobranças, inadimplência, faturamento por período, por serviço, por especialista. Tudo em tempo real, sem digitação manual.",
      features: [
        { icon: CreditCard, title: "Controle de cobranças", desc: "Registro de pagamentos, parcelamentos e métodos. Saiba exatamente quem pagou e quem está em aberto." },
        { icon: AlertCircle, title: "Gestão de inadimplência", desc: "Alertas automáticos para cobranças pendentes. Nunca mais perca receita por esquecimento." },
        { icon: TrendingUp, title: "Faturamento em tempo real", desc: "Receita por período, por serviço e por especialista. Visualize a saúde da clínica agora." },
        { icon: BarChart3, title: "Relatórios para contabilidade", desc: "Exportação em Excel com todos os filtros. O contador agradece." },
        { icon: FileText, title: "Comprovante de pagamento", desc: "PDF profissional gerado em segundos. Envie ao cliente pelo próprio sistema." },
        { icon: ArrowRight, title: "Histórico financeiro por cliente", desc: "Quanto cada cliente gastou, quando pagou e quais serviços adquiriu." },
      ],

      transformTitle: "Quando você sabe onde está cada centavo, decide diferente.",
      results: [
        { value: "100%", label: "Visibilidade financeira" },
        { value: "R$8k", label: "Recuperados em inadimplência (média)" },
        { value: "Zero", label: "Cobranças esquecidas" },
        { value: "1 clique", label: "Relatório para contabilidade" },
      ],

      ctaTitle: "Sua clínica merece controle financeiro de verdade.",
      ctaDesc: "Nossa equipe configura tudo e você começa a ver a realidade financeira da sua clínica no mesmo dia.",
    }} />
  );
}

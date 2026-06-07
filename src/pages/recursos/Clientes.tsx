import { RecursoLayout } from "@/components/landing/RecursoLayout";
import { Users, FileText, Camera, ClipboardList, Heart, ArrowRight } from "lucide-react";

export default function RecursoClientes() {
  return (
    <RecursoLayout content={{
      icon: Users,
      label: "Clientes",
      heroTitle: "O histórico da sua cliente está na sua cabeça. E isso é um risco.",
      heroDesc: "Procedimento feito em papel, foto tirada no celular pessoal, anamnese preenchida à mão. Se você sair, esse conhecimento vai com você.",

      problemTitle: "Você não tem prontuário. Você tem fragmentos espalhados.",
      problemSubtitle: "Sem histórico centralizado, cada atendimento começa do zero. Você perde tempo, comete erros evitáveis e não consegue mostrar evolução ao cliente.",
      pains: [
        "Anamnese em papel que some quando mais precisa",
        "Foto do antes numa conversa de WhatsApp que você nunca mais acha",
        "Não lembra qual produto usou no último procedimento da cliente",
        "Termo de consentimento não assinado ou perdido em uma pasta física",
        "Não sabe quais clientes não voltam há mais de 3 meses",
      ],
      amplifyQuote: "Se você precisar provar que orientou a cliente corretamente antes de um procedimento, você consegue? Sem o documento certo, na hora certa, você não tem proteção.",

      solutionTitle: "Prontuário digital completo — antes, durante e depois.",
      solutionDesc: "Tudo sobre cada cliente em um único lugar: anamnese, fotos, histórico de procedimentos, consentimentos e muito mais.",
      features: [
        { icon: FileText, title: "Prontuário digital completo", desc: "Histórico de atendimentos, notas clínicas, produtos utilizados e evolução do tratamento centralizado." },
        { icon: ClipboardList, title: "Fichas de anamnese", desc: "Diagrama corporal interativo, alergias, contraindicações e histórico médico em formulário digital." },
        { icon: Camera, title: "Fotos antes e depois", desc: "Galeria de imagens por cliente e procedimento. Mostre a evolução — e convença o cliente a continuar." },
        { icon: Heart, title: "Consentimento digital", desc: "Assinatura digital pelo próprio cliente. Documento gerado em PDF com validade legal." },
        { icon: Users, title: "Segmentação avançada", desc: "Filtre por serviço, data, status, inatividade. Encontre quem você procura em segundos." },
        { icon: ArrowRight, title: "Alerta de inativos", desc: "Identifique automaticamente quem não voltou. Dispare reativação com um clique." },
      ],

      transformTitle: "Quando você conhece de verdade cada cliente, tudo muda.",
      results: [
        { value: "100%", label: "Prontuários digitais" },
        { value: "Zero", label: "Papéis perdidos" },
        { value: "3x", label: "Mais retenção de clientes" },
        { value: "Legal", label: "Consentimentos válidos" },
      ],

      ctaTitle: "Seu conhecimento sobre cada cliente precisa estar protegido.",
      ctaDesc: "Nossa equipe migra seus dados, configura as fichas e você começa a usar no dia combinado.",
    }} />
  );
}

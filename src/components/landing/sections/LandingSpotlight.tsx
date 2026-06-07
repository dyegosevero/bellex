"use client";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, Megaphone, Check, ChevronRight, MessageCircle, Bell, RefreshCw, Star } from "lucide-react";
import { WhatsAppMock } from "@/components/landing/WhatsAppMock";

const tabs = [
  {
    key: "agendamento",
    icon: MessageCircle,
    label: "Novo agendamento",
    desc: "Cliente pede o horário, informa nome, e-mail e telefone — tudo pelo WhatsApp, sem ligar.",
  },
  {
    key: "lembrete",
    icon: Bell,
    label: "Lembrete automático",
    desc: "24h antes do horário, a Bellex envia um lembrete e reduz faltas em até 70%.",
  },
  {
    key: "reativacao",
    icon: RefreshCw,
    label: "Reativação de cliente",
    desc: "Clientes que somem após 60 dias recebem mensagem automática e voltam sem esforço.",
  },
  {
    key: "avaliacao",
    icon: Star,
    label: "Coleta de avaliação",
    desc: "Após cada atendimento, o sistema pede avaliação no Google — aumenta sua reputação.",
  },
];

const marketingRows = [
  { label: "Clientes notificados", value: "143", pct: "100%" },
  { label: "Abriram a mensagem",   value: "118", pct: "82%" },
  { label: "Agendaram novamente",  value: "41",  pct: "40%" },
];

export function LandingSpotlight() {
  const [activeTab, setActiveTab] = useState("agendamento");

  return (
    <section className="py-16 md:py-28" style={{ background: "hsl(30 25% 96%)" }}>
      <div className="mx-auto max-w-6xl px-6 space-y-20">

        {/* Agenda — abas esquerda, mock direita */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">

          {/* Left — label + title + tabs */}
          <div className="space-y-6 order-1">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-primary" />
                <span className="text-xs text-primary font-medium tracking-widest uppercase">Agenda & WhatsApp</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-light leading-snug mb-3 normal-case tracking-normal text-balance">
                Chega de confusão de horário. A agenda trabalha por você.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Agendamentos, lembretes, reativações e avaliações — tudo automatizado pelo WhatsApp.
              </p>
            </div>

            {/* Tab buttons */}
            <div className="space-y-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                      isActive
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 bg-transparent hover:bg-muted/50 hover:border-border"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      isActive ? "bg-primary/15" : "bg-muted"
                    }`}>
                      <tab.icon size={13} className={isActive ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {tab.label}
                      </p>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs text-muted-foreground leading-relaxed overflow-hidden"
                          >
                            {tab.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })}
            </div>

            <Link to="/recursos/agenda" className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:gap-2 transition-all">
              Ver Agenda Inteligente <ChevronRight size={13} />
            </Link>
          </div>

          {/* Right — iPhone */}
          <div className="flex items-center justify-end py-4 order-2 overflow-visible">
            <WhatsAppMock flowKey={activeTab} />
          </div>
        </div>

        {/* Marketing — visual esquerda, texto direita */}
        <div className="rounded-3xl" style={{ background: "hsl(10 50% 94%)" }}>
          <div className="grid md:grid-cols-2 gap-0 items-stretch">
          <div className="rounded-2xl m-6 border border-border/40 p-8 bg-white order-2 md:order-1 space-y-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Campanha enviada</p>
            <div className="space-y-3">
              {marketingRows.map(row => (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-foreground">{row.value}</span>
                  </div>
                  <div className="h-1.5 bg-border/50 rounded-full">
                    <div className="h-1.5 bg-primary/50 rounded-full" style={{ width: row.pct }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border/60">
              <p className="text-xs text-muted-foreground">Última campanha · há 2 dias</p>
              <p className="text-sm font-medium text-foreground mt-0.5">Taxa de retorno: <span className="text-primary">28,7%</span></p>
            </div>
          </div>
          <div className="space-y-5 order-1 md:order-2 p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <Megaphone size={14} className="text-primary" />
              <span className="text-xs text-primary font-medium tracking-widest uppercase">Marketing</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light leading-snug normal-case tracking-normal text-balance">Reative clientes inativos sem esforço manual.</h2>
            <p className="text-muted-foreground leading-relaxed">A Bellex identifica automaticamente quem não voltou em 60, 90 ou 120 dias e dispara campanhas personalizadas por WhatsApp e e-mail — sem você fazer nada.</p>
            <ul className="space-y-2">
              {["Reativação automática por inatividade", "Coleta de avaliações no Google após cada sessão", "Segmentação por serviço, especialista e período"].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={13} className="text-primary flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
            <Link to="/recursos/marketing" className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:gap-2 transition-all">
              Ver Marketing Automatizado <ChevronRight size={13} />
            </Link>
          </div>
          </div>
        </div>

      </div>
    </section>
  );
}

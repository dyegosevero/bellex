import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Iphone } from "@/components/ui/iphone";
import { ChevronLeft, Phone, Video, MoreVertical, Check } from "lucide-react";
import logoColor from "@/assets/logo-color.png";

type Msg = { from: "user" | "ai"; text: string; time: string; cancelLink?: true };

/* ── Conversation flows ────────────────────────────────────── */
export const flows: Record<string, { label: string; msgs: Msg[]; delays: number[] }> = {
  agendamento: {
    label: "Novo agendamento",
    msgs: [
      { from: "user", text: "Oi! Quero agendar uma limpeza de pele 🙂", time: "14:02" },
      { from: "ai",   text: "Olá! 😊 Para confirmar, qual é o seu nome completo?", time: "14:02" },
      { from: "user", text: "Camila Ferreira", time: "14:02" },
      { from: "ai",   text: "Obrigada, Camila! 📧 Qual é o seu e-mail?", time: "14:03" },
      { from: "user", text: "camila@exemplo.com", time: "14:03" },
      { from: "ai",   text: "Perfeito! 📱 E o seu telefone?", time: "14:03" },
      { from: "user", text: "(11) 99999-1234", time: "14:03" },
      { from: "ai",   text: "Tenho estes horários com a Bianca esta semana:\nQui 05/06 às 10h30 · Sex 06/06 às 13h · Sáb 07/06 às 09h", time: "14:04" },
      { from: "user", text: "Sex 06/06 às 13h! 👍", time: "14:04" },
      { from: "ai",   text: "✅ Agendado! Limpeza de Pele · Sex, 06/06 · 13h · Bianca S. Até lá! 🎉", time: "14:04", cancelLink: true },
    ],
    delays: [720, 1900, 3100, 4400, 5600, 6800, 8000, 9200, 10800, 12400],
  },
  lembrete: {
    label: "Lembrete automático",
    msgs: [
      { from: "ai",   text: "Olá, Camila! 😊 Lembrando que seu agendamento com a Bianca S. é amanhã, 06/06 às 13h. Te esperamos! 💆‍♀️", time: "08:00" },
      { from: "user", text: "Obrigada pelo lembrete! 👍", time: "08:12" },
      { from: "ai",   text: "Que ótimo! Precisa reagendar? É só responder aqui 😊", time: "08:12" },
      { from: "user", text: "Não, estarei lá! 🥰", time: "08:14" },
      { from: "ai",   text: "Perfeito! Até amanhã 🌸", time: "08:14" },
    ],
    delays: [600, 2000, 3400, 4800, 6200],
  },
  reativacao: {
    label: "Reativação de cliente",
    msgs: [
      { from: "ai",   text: "Oi, Camila! 😊 Faz 60 dias que não te vemos no Studio Bellex. Está tudo bem?", time: "10:30" },
      { from: "user", text: "Oi! Verdade, preciso de uma limpeza de pele", time: "10:45" },
      { from: "ai",   text: "Que ótimo! 💆‍♀️ Ainda tenho horários esta semana com a Bianca. Posso te mostrar?", time: "10:45" },
      { from: "user", text: "Sim, por favor!", time: "10:46" },
      { from: "ai",   text: "Qui 05/06 às 10h · Sex 06/06 às 13h · Sáb 07/06 às 09h. Qual prefere?", time: "10:46" },
    ],
    delays: [600, 2000, 3400, 4800, 6200],
  },
  avaliacao: {
    label: "Coleta de avaliação",
    msgs: [
      { from: "ai",   text: "Olá, Camila! 🌟 Como foi sua limpeza de pele com a Bianca hoje?", time: "16:00" },
      { from: "user", text: "Adorei! Pele maravilhosa 🥰", time: "16:04" },
      { from: "ai",   text: "Que ótimo! 😊 Que tal deixar uma avaliação no Google? Leva menos de 1 minuto e ajuda muito:", time: "16:04" },
      { from: "ai",   text: "⭐ g.page/studio-bellex/review", time: "16:04" },
      { from: "user", text: "Já avaliei! Nota 5 ⭐⭐⭐⭐⭐", time: "16:06" },
      { from: "ai",   text: "Muito obrigada, Camila! Até a próxima 🌸", time: "16:06" },
    ],
    delays: [600, 2000, 3400, 4500, 6000, 7400],
  },
};

/* ── WhatsApp wallpaper ────────────────────────────────────── */
const WA_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cpattern id='p' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cg fill='%23b2c9ad' fill-opacity='0.18'%3E%3Ccircle cx='20' cy='20' r='5'/%3E%3Ccircle cx='70' cy='20' r='5'/%3E%3Ccircle cx='20' cy='70' r='5'/%3E%3Ccircle cx='70' cy='70' r='5'/%3E%3Ccircle cx='45' cy='45' r='7'/%3E%3Cpath d='M8 17l3 6 6 0-5 4 2 6-6-3-6 3 2-6-5-4 6 0z'/%3E%3Cpath d='M58 67l3 6 6 0-5 4 2 6-6-3-6 3 2-6-5-4 6 0z'/%3E%3Cpath d='M83 12l2 4 4 0-3 3 1 4-4-2-4 2 1-4-3-3 4 0z'/%3E%3Cpath d='M33 82l2 4 4 0-3 3 1 4-4-2-4 2 1-4-3-3 4 0z'/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23p)'/%3E%3C/svg%3E"), linear-gradient(160deg, #d4e8d0 0%, #ddebd8 50%, #d0e4cc 100%)`;

/* ── Bubble ─────────────────────────────────────────────────── */
function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.from === "user";
  return (
    <motion.div
      layout
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className="relative max-w-[80%] px-2.5 pt-1.5 pb-1 shadow-sm"
        style={
          isUser
            ? { background: "#d9fdd3", borderRadius: "12px 2px 12px 12px" }
            : { background: "#ffffff", borderRadius: "2px 12px 12px 12px" }
        }
      >
        {msg.text.split("\n").map((line, i) => (
          <p key={i} className="text-[9.5px] leading-[1.5] text-gray-800">{line}</p>
        ))}
        {msg.cancelLink && (
          <p className="text-[9px] text-[#128C7E] underline mt-1 cursor-pointer">
            Cancelar agendamento →
          </p>
        )}
        <div className={`flex items-center gap-0.5 mt-0.5 justify-end`}>
          <span className="text-[7px] text-gray-400/90 leading-none">{msg.time}</span>
          {isUser && (
            <span className="flex ml-0.5 leading-none">
              <Check size={7} className="text-[#53bdeb] -mr-[3px]" />
              <Check size={7} className="text-[#53bdeb]" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export function WhatsAppMock({ flowKey = "agendamento" }: { flowKey?: string }) {
  const flow = flows[flowKey];
  const [visible, setVisible] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new message appears
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visible]);

  // Reveal messages one by one, then loop
  useEffect(() => {
    setVisible(0);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    flow.delays.forEach((d, i) => {
      timeouts.push(setTimeout(() => setVisible(i + 1), d));
    });

    // Restart after last message + pause
    const restartDelay = flow.delays[flow.delays.length - 1] + 3600;
    timeouts.push(setTimeout(() => setVisible(0), restartDelay));

    return () => timeouts.forEach(clearTimeout);
  }, [flowKey]);

  const showTyping =
    visible > 0 &&
    visible < flow.msgs.length &&
    flow.msgs[visible].from === "ai";

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <Iphone />

      {/* Screen content */}
      <div
        className="absolute z-0 flex flex-col overflow-hidden"
        style={{
          left: "4.91%", top: "2.18%",
          width: "89.95%", height: "95.63%",
          borderRadius: "14.3% / 6.6%",
          background: "#128C7E",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1 flex-shrink-0">
          <span className="text-white text-[8px] font-semibold">9:41</span>
          <div className="flex gap-1 items-center">
            <svg viewBox="0 0 20 14" className="w-3 h-2.5" fill="white">
              <rect x="0" y="6" width="3" height="8" rx="1" opacity=".4"/>
              <rect x="4.5" y="4" width="3" height="10" rx="1" opacity=".6"/>
              <rect x="9" y="2" width="3" height="12" rx="1" opacity=".8"/>
              <rect x="13.5" y="0" width="3" height="14" rx="1"/>
            </svg>
            <svg viewBox="0 0 18 14" className="w-3 h-2.5" fill="white">
              <path d="M9 3C5.7 3 2.7 4.4 1 6.5L3 9c1.2-1.7 3.3-2.8 6-2.8s4.8 1.1 6 2.8l2-2.5C15.3 4.4 12.3 3 9 3zm0 4c-1.9 0-3.5.8-4.5 2L6.5 11c.7-1 1.5-1.7 2.5-1.7s1.8.7 2.5 1.7L13.5 9C12.5 7.8 10.9 7 9 7z"/>
            </svg>
            <div className="flex items-center">
              <div className="w-3.5 h-1.5 rounded-sm border border-white/70 p-px flex">
                <div className="w-3/4 bg-white rounded-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Chat header */}
        <div className="flex items-center gap-2 px-2 py-1.5 flex-shrink-0">
          <ChevronLeft size={13} className="text-white flex-shrink-0" />
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src={logoColor} alt="" className="w-5 h-auto" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[10px] font-semibold leading-tight">Bellex · Agenda</div>
            <div className="text-white/70 text-[8px]">online agora</div>
          </div>
          <Video size={11} className="text-white" />
          <Phone size={11} className="text-white ml-1" />
          <MoreVertical size={11} className="text-white ml-1" />
        </div>

        {/* Messages area */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 flex flex-col gap-1.5"
          style={{ background: WA_BG, scrollBehavior: "smooth" }}
        >
          <AnimatePresence initial={false}>
            {flow.msgs.slice(0, visible).map((msg, i) => (
              <Bubble key={`${flowKey}-${i}`} msg={msg} />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {showTyping && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.18 }}
              >
                <div className="bg-white px-2.5 py-2 shadow-sm flex items-center gap-0.5" style={{ borderRadius: "2px 12px 12px 12px" }}>
                  {[0, 0.18, 0.36].map((d, i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full bg-gray-400"
                      animate={{ y: [0, -2.5, 0] }}
                      transition={{ duration: 0.55, repeat: Infinity, delay: d, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Scroll anchor */}
          <div className="h-px flex-shrink-0" />
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-1.5 px-2 py-2 flex-shrink-0 bg-[#f0f2f0]">
          <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center min-h-[22px]">
            <span className="text-[9px] text-gray-400 leading-none">Mensagem</span>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[#25D366]">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

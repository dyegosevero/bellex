import { motion, useInView } from "motion/react";
import { useRef } from "react";

// Ilustração: prontuário fragmentado — papeis, câmera, bolha — representando caos de registros
export function IlluProntuario({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  const draw = (delay: number, duration = 1.4) => ({
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1, opacity: 1,
      transition: { pathLength: { delay, duration, ease: "easeInOut" }, opacity: { delay, duration: 0.01 } },
    },
  });

  const props = (delay: number, duration?: number) => ({
    variants: draw(delay, duration),
    initial: "hidden" as const,
    animate: inView ? "visible" as const : "hidden" as const,
    pathLength: "1" as unknown as number,
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 320 280"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Papel principal — prontuário */}
      <motion.rect x="90" y="30" width="100" height="130" rx="6" stroke="currentColor" strokeWidth="1.5" {...props(0)} />
      {/* Linhas de texto no prontuário */}
      <motion.line x1="104" y1="56" x2="176" y2="56" stroke="currentColor" strokeWidth="1" {...props(0.2)} />
      <motion.line x1="104" y1="70" x2="170" y2="70" stroke="currentColor" strokeWidth="1" {...props(0.3)} />
      <motion.line x1="104" y1="84" x2="165" y2="84" stroke="currentColor" strokeWidth="1" {...props(0.4)} />
      <motion.line x1="104" y1="98" x2="155" y2="98" stroke="currentColor" strokeWidth="1" {...props(0.5)} />
      {/* Clip no topo do prontuário */}
      <motion.rect x="124" y="22" width="32" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" {...props(0.1)} />

      {/* Papel 2 — deslocado — caótico */}
      <motion.rect x="200" y="60" width="80" height="100" rx="5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 2" {...props(0.6)} />
      <motion.line x1="212" y1="84" x2="268" y2="84" stroke="currentColor" strokeWidth="0.8" {...props(0.8)} />
      <motion.line x1="212" y1="96" x2="260" y2="96" stroke="currentColor" strokeWidth="0.8" {...props(0.9)} />
      <motion.line x1="212" y1="108" x2="250" y2="108" stroke="currentColor" strokeWidth="0.8" {...props(1.0)} />

      {/* Câmera — foto no celular */}
      <motion.rect x="22" y="80" width="56" height="44" rx="8" stroke="currentColor" strokeWidth="1.5" {...props(0.5)} />
      <motion.circle cx="50" cy="102" r="12" stroke="currentColor" strokeWidth="1.2" {...props(0.7)} />
      <motion.circle cx="50" cy="102" r="5" stroke="currentColor" strokeWidth="1" {...props(0.9)} />
      <motion.rect x="30" y="85" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="0.8" {...props(0.8)} />

      {/* Bolha de WhatsApp */}
      <motion.path
        d="M22 160 Q22 148 34 148 L82 148 Q94 148 94 160 L94 182 Q94 194 82 194 L42 194 L28 204 L32 194 Q22 194 22 182 Z"
        stroke="currentColor" strokeWidth="1.5"
        {...props(0.7)}
      />
      <motion.line x1="34" y1="165" x2="82" y2="165" stroke="currentColor" strokeWidth="0.8" {...props(0.9)} />
      <motion.line x1="34" y1="176" x2="70" y2="176" stroke="currentColor" strokeWidth="0.8" {...props(1.0)} />

      {/* Seta fragmentada — representando falta de conexão */}
      <motion.path d="M96 170 Q140 160 192 140" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" {...props(1.0, 1.0)} />
      <motion.path d="M188 180 Q230 170 282 150" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" {...props(1.1, 1.0)} />

      {/* X — símbolo de caos/erro */}
      <motion.line x1="236" y1="196" x2="256" y2="216" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props(1.2)} />
      <motion.line x1="256" y1="196" x2="236" y2="216" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props(1.3)} />

      {/* Papel solto no canto — caindo */}
      <motion.path d="M260 230 L298 230 L298 260 L260 260 Z" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" {...props(1.1)} />
      <motion.line x1="268" y1="242" x2="290" y2="242" stroke="currentColor" strokeWidth="0.7" {...props(1.3)} />
      <motion.line x1="268" y1="252" x2="285" y2="252" stroke="currentColor" strokeWidth="0.7" {...props(1.4)} />
    </svg>
  );
}

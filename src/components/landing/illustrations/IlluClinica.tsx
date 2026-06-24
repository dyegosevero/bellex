import { motion, useInView } from "motion/react";
import { useRef } from "react";

// Ilustração: clínica organizada — cruz, folha, check, dados — representa o resultado com Bellex
export function IlluClinica({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  const draw = (delay: number, duration = 1.2) => ({
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1, opacity: 1,
      transition: { pathLength: { delay, duration, ease: "easeInOut" }, opacity: { delay, duration: 0.01 } },
    },
  });
  const p = (delay: number, duration?: number) => ({
    variants: draw(delay, duration),
    initial: "hidden" as const,
    animate: inView ? "visible" as const : "hidden" as const,
    pathLength: "1" as unknown as number,
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 280 280"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo externo */}
      <motion.circle cx="140" cy="140" r="110" stroke="currentColor" strokeWidth="1" strokeDasharray="6 4" {...p(0, 2)} />

      {/* Cruz médica central */}
      <motion.rect x="122" y="100" width="36" height="80" rx="6" stroke="currentColor" strokeWidth="1.5" {...p(0.3)} />
      <motion.rect x="102" y="120" width="76" height="36" rx="6" stroke="currentColor" strokeWidth="1.5" {...p(0.5)} />

      {/* Folha / natureza — canto superior direito */}
      <motion.path d="M198 52 Q228 52 228 82 Q228 112 198 112 Q198 82 198 52Z" stroke="currentColor" strokeWidth="1.2" {...p(0.8)} />
      <motion.line x1="198" y1="52" x2="198" y2="112" stroke="currentColor" strokeWidth="0.8" {...p(1.0)} />
      <motion.path d="M198 72 Q212 72 212 82" stroke="currentColor" strokeWidth="0.7" {...p(1.1)} />
      <motion.path d="M198 82 Q212 82 212 92" stroke="currentColor" strokeWidth="0.7" {...p(1.2)} />

      {/* Check — canto inferior esquerdo */}
      <motion.circle cx="72" cy="200" r="22" stroke="currentColor" strokeWidth="1.2" {...p(0.7)} />
      <motion.path d="M60 200 L68 210 L85 190" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p(1.0)} />

      {/* Gráfico de barras — canto inferior direito */}
      <motion.line x1="192" y1="230" x2="260" y2="230" stroke="currentColor" strokeWidth="1" {...p(0.6)} />
      <motion.rect x="200" y="210" width="12" height="20" rx="2" stroke="currentColor" strokeWidth="1" {...p(0.9)} />
      <motion.rect x="218" y="200" width="12" height="30" rx="2" stroke="currentColor" strokeWidth="1" {...p(1.0)} />
      <motion.rect x="236" y="190" width="12" height="40" rx="2" stroke="currentColor" strokeWidth="1" {...p(1.1)} />

      {/* Sparkles — pontos de destaque */}
      <motion.path d="M56 84 L58 78 L60 84 L66 86 L60 88 L58 94 L56 88 L50 86Z" stroke="currentColor" strokeWidth="0.8" {...p(1.2, 0.6)} />
      <motion.path d="M218 158 L219.5 154 L221 158 L225 159.5 L221 161 L219.5 165 L218 161 L214 159.5Z" stroke="currentColor" strokeWidth="0.7" {...p(1.4, 0.5)} />

      {/* Linha pontilhada conectando elementos */}
      <motion.path d="M80 200 Q100 180 120 160" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 3" {...p(1.1, 0.8)} />
      <motion.path d="M160 120 Q182 108 198 112" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 3" {...p(1.2, 0.8)} />
      <motion.path d="M160 160 Q185 180 200 210" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 3" {...p(1.3, 0.8)} />
    </svg>
  );
}

import { motion, useInView } from "motion/react";
import { useRef } from "react";

// Ilustração: fluxo de 3 etapas conectadas — representa o onboarding/processo
export function IlluFlow({ className = "" }: { className?: string }) {
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
      viewBox="0 0 340 180"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Nó 1 — círculo + ícone calendário */}
      <motion.circle cx="54" cy="90" r="36" stroke="currentColor" strokeWidth="1.5" {...p(0)} />
      {/* Calendário simplificado */}
      <motion.rect x="38" y="76" width="32" height="28" rx="3" stroke="currentColor" strokeWidth="1" {...p(0.2)} />
      <motion.line x1="38" y1="84" x2="70" y2="84" stroke="currentColor" strokeWidth="0.8" {...p(0.4)} />
      <motion.line x1="46" y1="72" x2="46" y2="80" stroke="currentColor" strokeWidth="1" strokeLinecap="round" {...p(0.3)} />
      <motion.line x1="62" y1="72" x2="62" y2="80" stroke="currentColor" strokeWidth="1" strokeLinecap="round" {...p(0.3)} />
      <motion.rect x="42" y="88" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="0.7" {...p(0.5)} />
      <motion.rect x="52" y="88" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="0.7" {...p(0.55)} />
      <motion.rect x="62" y="88" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="0.7" {...p(0.6)} />

      {/* Linha conectora 1→2 */}
      <motion.path d="M90 90 Q116 60 142 90" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" strokeLinecap="round" {...p(0.7, 0.8)} />
      {/* Seta */}
      <motion.path d="M138 84 L144 90 L138 96" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...p(1.3, 0.3)} />

      {/* Nó 2 — círculo + ícone assinatura/contrato */}
      <motion.circle cx="170" cy="90" r="36" stroke="currentColor" strokeWidth="1.5" {...p(0.5)} />
      <motion.rect x="154" y="76" width="32" height="28" rx="3" stroke="currentColor" strokeWidth="1" {...p(0.7)} />
      <motion.line x1="158" y1="84" x2="182" y2="84" stroke="currentColor" strokeWidth="0.8" {...p(0.9)} />
      <motion.line x1="158" y1="90" x2="178" y2="90" stroke="currentColor" strokeWidth="0.8" {...p(0.95)} />
      {/* Assinatura ondulada */}
      <motion.path d="M158 98 Q163 94 168 98 Q173 102 178 98 L182 98" stroke="currentColor" strokeWidth="1" strokeLinecap="round" {...p(1.0)} />

      {/* Linha conectora 2→3 */}
      <motion.path d="M206 90 Q232 60 258 90" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" strokeLinecap="round" {...p(1.1, 0.8)} />
      <motion.path d="M254 84 L260 90 L254 96" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...p(1.7, 0.3)} />

      {/* Nó 3 — círculo + ícone foguete */}
      <motion.circle cx="286" cy="90" r="36" stroke="currentColor" strokeWidth="1.5" {...p(1.0)} />
      {/* Foguete simplificado */}
      <motion.path d="M286 68 Q294 78 294 90 L286 98 L278 90 Q278 78 286 68Z" stroke="currentColor" strokeWidth="1" {...p(1.2)} />
      <motion.path d="M278 90 L272 96 L278 100" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" {...p(1.4)} />
      <motion.path d="M294 90 L300 96 L294 100" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" {...p(1.4)} />
      <motion.circle cx="286" cy="86" r="4" stroke="currentColor" strokeWidth="0.8" {...p(1.3)} />
      {/* Chamas */}
      <motion.path d="M283 100 Q286 108 289 100" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" {...p(1.5)} />

      {/* Label 01 */}
      <motion.text x="54" y="142" textAnchor="middle" fontSize="9" fill="none" stroke="currentColor" strokeWidth="0.3"
        variants={draw(0.4, 0.8)} initial="hidden" animate={inView ? "visible" : "hidden"}
      >Demo</motion.text>
      {/* Label 02 */}
      <motion.text x="170" y="142" textAnchor="middle" fontSize="9" fill="none" stroke="currentColor" strokeWidth="0.3"
        variants={draw(0.9, 0.8)} initial="hidden" animate={inView ? "visible" : "hidden"}
      >Contrato</motion.text>
      {/* Label 03 */}
      <motion.text x="286" y="142" textAnchor="middle" fontSize="9" fill="none" stroke="currentColor" strokeWidth="0.3"
        variants={draw(1.4, 0.8)} initial="hidden" animate={inView ? "visible" : "hidden"}
      >Go-live</motion.text>
    </svg>
  );
}

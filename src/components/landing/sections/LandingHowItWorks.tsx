import { Calendar, FileSignature, Rocket } from "lucide-react";
import { motion } from "motion/react";
import { FadeUp } from "./utils";
import Grainient from "@/components/Grainient";

const steps = [
  {
    n: "01",
    icon: Calendar,
    tag: "Dia 1",
    title: "Você assiste, a gente mostra",
    desc: "30 minutos. A gente abre o sistema ao vivo e você vê exatamente o que vai ganhar — com dados do seu tipo de clínica, não de uma clínica genérica.",
    detail: "Nada de PDF, nada de apresentação. Você vê funcionando.",
  },
  {
    n: "02",
    icon: FileSignature,
    tag: "Semana 1",
    title: "A gente configura tudo",
    desc: "Depois que você fala 'quero', nossa equipe entra em campo. Agenda, serviços, equipe, cobranças — tudo montado do zero pra sua clínica.",
    detail: "Você não mexe em nada. Só confere quando estiver pronto.",
  },
  {
    n: "03",
    icon: Rocket,
    tag: "Go-live",
    title: "Abre e usa",
    desc: "No dia combinado, a plataforma já está no ar com tudo configurado. Sua equipe entra, atende e cobra — sem curva de aprendizado.",
    detail: "A maioria das clínicas começa a faturar no primeiro dia.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="relative py-16 md:py-28 overflow-hidden">
      {/* Grainient de fundo — opacidade 50% */}
      <div className="absolute inset-0" style={{ opacity: 0.5 }}>
        <Grainient
          color1="#fde8e0"
          color2="#f5c4b5"
          color3="#fdf0ec"
          timeSpeed={0.15}
          colorBalance={0}
          warpStrength={0.6}
          warpFrequency={3}
          warpSpeed={1}
          warpAmplitude={30}
          blendAngle={20}
          blendSoftness={0.08}
          rotationAmount={300}
          noiseScale={1.5}
          grainAmount={0.05}
          grainScale={2}
          grainAnimated={false}
          contrast={1.1}
          gamma={1}
          saturation={0.7}
          centerX={0}
          centerY={0}
          zoom={0.85}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <FadeUp className="mb-16">
          <p className="text-xs text-primary tracking-widest uppercase font-medium mb-3">Como funciona</p>
          <h2 className="text-4xl font-light max-w-lg leading-tight normal-case tracking-normal text-balance">
            Tudo num só lugar, <span className="text-primary/60 font-normal">sem assinaturas empilhadas.</span>
          </h2>
        </FadeUp>

        <div className="relative">
          <div className="hidden md:block absolute top-10 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <FadeUp key={step.n} delay={i * 120}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative group"
                >
                  <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm p-7 h-full transition-shadow duration-300 group-hover:shadow-[0_8px_40px_-12px_hsl(10_75%_77%/0.3)] group-hover:border-primary/20">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <step.icon size={18} className="text-primary" />
                      </div>
                      <span className="text-xs font-medium text-primary/60 bg-primary/8 px-2.5 py-1 rounded-full tracking-wide">
                        {step.tag}
                      </span>
                    </div>
                    <div className="mb-3">
                      <span className="text-4xl font-light text-primary/15 leading-none block mb-1">{step.n}</span>
                      <h3 className="text-base font-semibold tracking-wide uppercase">{step.title}</h3>
                    </div>
                    <p className="text-sm text-foreground/65 leading-relaxed mb-4">{step.desc}</p>
                    <p className="text-xs text-primary/60 font-medium border-t border-border/30 pt-4 mt-auto">
                      {step.detail}
                    </p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ShimmerButton } from "./ShimmerButton";
import BlurText from "@/components/reactbits/BlurText";
import { FadeUp } from "./sections/utils";
import Grainient from "@/components/Grainient";

interface RecursoHeroProps {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  accentColor?: string;
}

export function RecursoHero({ icon: Icon, label, title, description }: RecursoHeroProps) {
  const words = title.split(" ");
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(" ");
  const line2 = words.slice(mid).join(" ");

  return (
    <section className="relative pt-36 pb-28 px-6 overflow-hidden">
      {/* Grainient — mesma paleta salmão do login */}
      <div className="absolute inset-0">
        <Grainient
          color1="#f5c5b8"
          color2="#e89070"
          color3="#fde8df"
          timeSpeed={0.2}
          colorBalance={0}
          warpStrength={0.7}
          warpFrequency={4}
          warpSpeed={1.2}
          warpAmplitude={35}
          blendAngle={10}
          blendSoftness={0.06}
          rotationAmount={350}
          noiseScale={1.8}
          grainAmount={0.06}
          grainScale={2}
          grainAnimated={false}
          contrast={1.15}
          gamma={1}
          saturation={0.8}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <FadeUp className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-4 py-1.5 rounded-full border border-white/40 bg-white/25 text-white backdrop-blur-sm tracking-wide">
            <Icon size={11} strokeWidth={1.8} />
            {label}
          </div>
        </FadeUp>

        {/* Title — BlurText */}
        <div className="mb-6">
          <BlurText
            text={line1}
            className="font-heading text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.05] text-white justify-center"
            delay={65}
            animateBy="words"
            direction="top"
          />
          {line2 && (
            <BlurText
              text={line2}
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.05] text-white/80 justify-center"
              delay={65}
              animateBy="words"
              direction="top"
            />
          )}
        </div>

        {/* Description */}
        <FadeUp delay={320} className="mb-10">
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
            {description}
          </p>
        </FadeUp>

        {/* CTAs */}
        <FadeUp delay={460} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-primary font-medium px-7 py-3.5 rounded-xl hover:bg-white/90 transition-colors text-sm shadow-sm"
          >
            Agendar Demo
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors border border-white/30 px-5 py-3.5 rounded-xl hover:bg-white/10 backdrop-blur-sm"
          >
            Ver todos os recursos
          </Link>
        </FadeUp>

        <FadeUp delay={560}>
          <p className="text-xs text-white/50 mt-4">
            Configurado pela nossa equipe · Sem fidelidade · Suporte incluído
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

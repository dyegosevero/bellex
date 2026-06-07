import { Link } from "react-router-dom";
import { FadeUp } from "./utils";
import { ShimmerButton } from "@/components/landing/ShimmerButton";
import Grainient from "@/components/Grainient";

export function LandingCta() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0">
        <Grainient
          color1="#f5c5b8"
          color2="#e8957a"
          color3="#f0d5cc"
          timeSpeed={0.2}
          colorBalance={0}
          warpStrength={0.8}
          warpFrequency={4}
          warpSpeed={1.5}
          warpAmplitude={40}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={400}
          noiseScale={2}
          grainAmount={0.06}
          grainScale={2}
          grainAnimated={false}
          contrast={1.2}
          gamma={1}
          saturation={0.85}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>
      <FadeUp className="relative z-10 max-w-3xl mx-auto text-center">
        <p className="text-xs text-white/70 tracking-widest uppercase font-medium mb-6">Comece hoje</p>
        <h2 className="font-heading text-5xl md:text-6xl font-light tracking-tight text-white leading-tight mb-5">
          Chega de apagar<br />
          incêndio todo dia.
        </h2>
        <p className="text-white/75 font-light mb-10 max-w-md mx-auto leading-relaxed">
          Tudo que você precisaria de 2 ou 3 sistemas diferentes — numa única plataforma, do jeito que a sua clínica precisa.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-primary font-medium px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors text-sm shadow-sm"
          >
            Agendar Demo
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors border border-white/30 px-5 py-3.5 rounded-xl hover:bg-white/10 backdrop-blur-sm"
          >
            Falar com a equipe
          </Link>
        </div>
      </FadeUp>
    </section>
  );
}

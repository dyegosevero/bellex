import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import BlurText from "@/components/reactbits/BlurText";
import { FadeUp } from "./sections/utils";
import { useDemoModal } from "./DemoModalContext";

interface RecursoHeroProps {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
}

export function RecursoHero({ icon: Icon, label, title, description }: RecursoHeroProps) {
  const { openDemo } = useDemoModal();

  return (
    <section
      className="relative pt-36 pb-24 px-6"
      style={{ background: "linear-gradient(180deg, hsl(10 45% 94%) 0%, hsl(30 40% 96%) 50%, hsl(30 25% 98%) 100%)" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <FadeUp className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/8 rounded-full px-4 py-1.5 text-xs text-primary font-medium tracking-wide backdrop-blur-sm">
            <Icon size={11} strokeWidth={1.8} />
            {label}
          </div>
        </FadeUp>

        {/* Título — mesmo estilo do hero principal, dois tons */}
        <h1 className="mb-6 normal-case tracking-tight">
          {(() => {
            // parte 1 = até o primeiro ponto final; parte 2 = resto (se existir)
            const dotIdx = title.indexOf(". ");
            if (dotIdx !== -1) {
              const part1 = title.slice(0, dotIdx + 1);
              const part2 = title.slice(dotIdx + 2);
              return (
                <>
                  <BlurText
                    text={part1}
                    className="font-heading text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1] text-foreground justify-center normal-case"
                    delay={65}
                    animateBy="words"
                    direction="top"
                  />
                  <BlurText
                    text={part2}
                    className="font-heading text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1] text-muted-foreground justify-center normal-case"
                    delay={65}
                    animateBy="words"
                    direction="top"
                  />
                </>
              );
            }
            // título de uma frase só — divide na vírgula
            const commaIdx = title.indexOf(", ");
            if (commaIdx !== -1) {
              const part1 = title.slice(0, commaIdx + 1);
              const part2 = title.slice(commaIdx + 2);
              return (
                <>
                  <BlurText
                    text={part1}
                    className="font-heading text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1] text-foreground justify-center normal-case"
                    delay={65}
                    animateBy="words"
                    direction="top"
                  />
                  <BlurText
                    text={part2}
                    className="font-heading text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1] text-primary justify-center normal-case"
                    delay={65}
                    animateBy="words"
                    direction="top"
                  />
                </>
              );
            }
            return (
              <BlurText
                text={title}
                className="font-heading text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1] text-foreground justify-center normal-case"
                delay={65}
                animateBy="words"
                direction="top"
              />
            );
          })()}
        </h1>

        {/* Descrição */}
        <FadeUp delay={320} className="mb-10">
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-light max-w-xl mx-auto">
            {description}
          </p>
        </FadeUp>

        {/* CTAs — mesmo estilo do hero principal */}
        <FadeUp delay={450} className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={openDemo}
            className="bg-primary text-white font-medium px-7 py-3.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            Agendar Demo
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border/60 px-5 py-3.5 rounded-xl hover:bg-background/60 bg-background/40 backdrop-blur-sm"
          >
            Ver todos os recursos
          </Link>
        </FadeUp>

        <FadeUp delay={560}>
          <p className="text-xs text-muted-foreground/60 mt-4">
            Configurado pela nossa equipe · Sem fidelidade · Suporte incluído
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

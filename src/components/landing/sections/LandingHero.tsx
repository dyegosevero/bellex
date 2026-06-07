import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import BlurText from "@/components/reactbits/BlurText";
import { ContainerScroll } from "@/components/ui/container-scroll";
import DashboardMock from "@/components/landing/DashboardMock";
import { FadeUp } from "./utils";
import { ShimmerButton } from "@/components/landing/ShimmerButton";
import Grainient from "@/components/Grainient";

export function LandingHero() {
  return (
    <section
      className="relative"
      style={{ background: "linear-gradient(180deg, hsl(10 60% 93%) 0%, hsl(30 40% 96%) 45%, hsl(30 25% 98%) 100%)" }}
    >
      <ContainerScroll
        titleComponent={
          <div className="pt-24 pb-4 mb-10 px-6">
            <FadeUp className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/8 rounded-full px-4 py-1.5 text-xs text-primary font-medium tracking-wide backdrop-blur-sm">
                <Zap size={11} />
                Gestão completa para clínicas de estética e saúde
              </div>
            </FadeUp>

            <div className="mb-6 text-center">
              <BlurText text="Sua clínica cresce." className="font-heading text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.05] text-foreground justify-center" delay={70} animateBy="words" direction="top" />
              <BlurText text="Sua agenda também." className="font-heading text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.05] text-primary justify-center" delay={70} animateBy="words" direction="top" />
            </div>

            <FadeUp delay={300} className="mb-8">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-light max-w-xl mx-auto text-center">
                Clínicas que usam Bellex reduzem em <strong className="text-foreground font-medium">40h por mês</strong> tarefas manuais — e aumentam o faturamento sem contratar mais ninguém.
              </p>
            </FadeUp>

            <FadeUp delay={450} className="flex flex-wrap items-center justify-center gap-3">
              <ShimmerButton to="/login" className="px-7 py-3.5 text-sm">
                Agendar Demo
              </ShimmerButton>
              <button
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border/60 px-5 py-3.5 rounded-xl hover:bg-background/60 bg-background/40 backdrop-blur-sm"
              >
                Ver como funciona <ArrowRight size={13} />
              </button>
              <span className="text-xs text-muted-foreground/70 w-full text-center">30 min · sem compromisso · com sua equipe</span>
            </FadeUp>
          </div>
        }
      >
        <DashboardMock />
      </ContainerScroll>
    </section>
  );
}

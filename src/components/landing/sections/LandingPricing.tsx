import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { FadeUp } from "./utils";
import { plans } from "./data";

export function LandingPricing() {
  return (
    <section id="precos" className="py-24 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <FadeUp className="mb-14 text-center">
          <p className="text-xs text-primary tracking-widest uppercase font-medium mb-4">Planos</p>
          <h2 className="font-heading text-4xl md:text-5xl font-light tracking-tight text-foreground">Simples e transparente.</h2>
          <p className="text-muted-foreground mt-3 font-light">Agende uma demonstração personalizada para sua clínica.</p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p, i) => (
            <FadeUp key={p.name} delay={i * 80}>
              <div className={`p-7 rounded-2xl border h-full flex flex-col gap-7 ${p.highlighted ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}>
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    {p.highlighted && <span className="text-[10px] bg-primary text-white px-2.5 py-1 rounded-full font-medium tracking-wide">Mais escolhido</span>}
                  </div>
                  <div className="mb-1">
                    <span className="font-heading text-4xl font-light tracking-tight text-foreground">{p.price}</span>
                    {p.period && <span className="text-sm ml-1 text-muted-foreground">{p.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground font-light">{p.desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-sm">
                      <Check size={13} className="text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={`text-center text-sm font-medium px-6 py-3 rounded-xl transition-all ${p.highlighted ? "bg-primary text-white hover:bg-primary/90" : "border border-border text-foreground hover:bg-muted/50"}`}>
                  {p.cta}
                </Link>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

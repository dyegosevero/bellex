import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { faqs } from "./data";
import { LogoDraw } from "@/components/ui/logo-draw";

export function LandingFaq() {
  return (
    <section id="faq" className="relative py-16 md:py-28 overflow-hidden" style={{ background: "hsl(30 20% 97%)" }}>
      {/* Logo ultra-thin — bottom-left watermark */}
      <div className="pointer-events-none absolute -bottom-8 -left-16 z-0">
        <LogoDraw
          size={260}
          strokeColor="hsl(10 30% 60% / 0.08)"
          fillColor="hsl(10 30% 60% / 0)"
          drawDuration={3200}
          fillDuration={1}
          fillDelay={999999}
        />
      </div>
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <p className="text-xs text-primary tracking-widest uppercase font-medium mb-3">Dúvidas</p>
            <h2 className="text-4xl font-light leading-tight normal-case tracking-normal text-balance">
              Perguntas <span className="text-muted-foreground font-normal">frequentes.</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              Não encontrou sua resposta?{" "}
              <Link to="/login" className="text-primary underline underline-offset-2">Fale com a equipe.</Link>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-white border border-primary/15 rounded-2xl px-5 py-4 cursor-pointer hover:border-primary/30 transition-colors"
              >
                <summary className="flex items-center justify-between gap-4 list-none text-sm font-medium text-foreground select-none">
                  {faq.q}
                  <ChevronRight size={14} className="text-primary/50 flex-shrink-0 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-t border-primary/10 pt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

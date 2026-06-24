import { type LucideIcon, XCircle, CheckCircle2 } from "lucide-react";
import { LandingNav } from "./LandingNav";
import { LandingFooter } from "./LandingFooter";
import { RecursoHero } from "./RecursoHero";
import { TestimonialsMarquee } from "./TestimonialsMarquee";
import { ShimmerButton } from "./ShimmerButton";
import { Link } from "react-router-dom";

export interface RecursoFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface RecursoPageContent {
  icon: LucideIcon;
  label: string;
  heroTitle: string;
  heroDesc: string;
  // PASTOR — P: Problem
  problemTitle: string;
  problemSubtitle: string;
  pains: string[];
  // PASTOR — A: Amplify
  amplifyQuote: string;
  // PASTOR — S: Solution/Mechanism
  solutionTitle: string;
  solutionDesc: string;
  features: RecursoFeature[];
  // PASTOR — T: Transformation
  transformTitle: string;
  results: { label: string; value: string }[];
  // PASTOR — O+R: CTA
  ctaTitle: string;
  ctaDesc: string;
}

export function RecursoLayout({ content }: { content: RecursoPageContent }) {
  const { icon: Icon } = content;
  return (
    <div className="min-h-screen bg-background font-body">
      <LandingNav />

      {/* P — Problem (hero) */}
      <RecursoHero
        icon={content.icon}
        label={content.label}
        title={content.heroTitle}
        description={content.heroDesc}
      />

      {/* A — Amplify: dor */}
      <section className="py-20 px-6" style={{ background: "hsl(30 20% 97%)" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs text-primary tracking-widest uppercase font-medium mb-4">O problema real</p>
            <h2 className="text-3xl md:text-4xl font-light leading-tight text-foreground mb-4">
              {content.problemTitle}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">{content.problemSubtitle}</p>
            <blockquote className="border-l-2 border-primary pl-5 text-sm text-muted-foreground italic leading-relaxed">
              {content.amplifyQuote}
            </blockquote>
          </div>
          <div className="space-y-3">
            {content.pains.map((pain) => (
              <div key={pain} className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-background">
                <XCircle size={16} className="text-primary/50 mt-0.5 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* S — Solution: mecanismo + features */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-primary tracking-widest uppercase font-medium mb-3">A solução</p>
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4 max-w-2xl mx-auto leading-tight">
              {content.solutionTitle}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">{content.solutionDesc}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {content.features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border/50 bg-background p-6 hover:border-primary/20 hover:shadow-[0_4px_24px_-8px_hsl(10_75%_77%/0.2)] transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                  <f.icon size={18} className="text-primary" />
                </div>
                <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* T — Transformation: resultados */}
      <section className="py-20 px-6 relative overflow-hidden" style={{ background: "hsl(10 60% 96%)" }}>
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <p className="text-xs text-primary tracking-widest uppercase font-medium mb-4">Resultados reais</p>
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-14 max-w-xl mx-auto leading-tight">
            {content.transformTitle}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 rounded-2xl overflow-hidden">
            {content.results.map((r) => (
              <div key={r.label} className="bg-background/80 backdrop-blur-sm px-6 py-8 text-center">
                <p className="text-4xl md:text-5xl font-light text-primary mb-2">{r.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* T — Testimonials marquee */}
      <TestimonialsMarquee />

      {/* O+R — Offer + Response */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            {["Configuração pela nossa equipe", "Sem fidelidade", "Suporte incluído"].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 size={12} className="text-primary" />
                {item}
              </div>
            ))}
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-4 leading-tight">
            {content.ctaTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-md mx-auto">
            {content.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <ShimmerButton to="/login" className="px-8 py-3.5 text-sm">
              Agendar Demo
            </ShimmerButton>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors border border-border px-5 py-3.5 rounded-xl hover:bg-muted/40">
              Ver todos os recursos
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

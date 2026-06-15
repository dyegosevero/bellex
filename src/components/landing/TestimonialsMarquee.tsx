import { Marquee } from "./Marquee";
import { testimonials, testimonials2 } from "./recurso-data";

function Card({ name, role, text, avatar }: { name: string; role: string; text: string; avatar: string }) {
  return (
    <div className="w-[340px] rounded-2xl border border-border/50 bg-background p-5 space-y-4">
      <p className="text-sm text-foreground leading-relaxed">"{text}"</p>
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={name}
          className="w-9 h-9 rounded-full object-cover shrink-0 border border-border/40"
        />
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsMarquee() {
  const row1 = testimonials.map((t) => <Card key={t.name} {...t} />);
  const row2 = testimonials2.map((t) => <Card key={t.name} {...t} />);

  return (
    <section id="depoimentos" className="py-20 overflow-hidden" style={{ background: "hsl(30 25% 98%)" }}>
      <div className="max-w-5xl mx-auto px-6 mb-12 text-center">
        <p className="text-xs text-primary tracking-widest uppercase font-medium mb-3">Depoimentos</p>
        <h2 className="text-3xl font-light text-foreground">
          Clínicas que já <span className="text-primary">transformaram</span> a gestão
        </h2>
      </div>
      <div className="space-y-2">
        <Marquee items={row1} speed={90} />
        <Marquee items={row2} speed={75} reverse />
      </div>
    </section>
  );
}

import { CountUp, FadeUp } from "./utils";
import { stats } from "./data";

export function LandingStats() {
  return (
    <section className="py-16 px-6 bg-background border-y border-border/60">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s, i) => (
            <FadeUp key={s.label} delay={i * 80} className="px-8 py-4 first:pl-0 last:pr-0">
              <div className="font-heading text-4xl md:text-5xl font-light tracking-tight text-foreground mb-1">
                <CountUp to={s.value} suffix={s.suffix} duration={2} />
              </div>
              <div className="text-sm text-muted-foreground font-light">{s.label}</div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

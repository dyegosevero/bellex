import { CountUp, FadeUp } from "./utils";
import { stats } from "./data";

export function LandingStats() {
  return (
    <section className="py-16 px-6 bg-background border-y border-border/60">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-border">
          {stats.map((s, i) => (
            <FadeUp key={s.label} delay={i * 80} className="py-6 md:py-4 md:px-8 md:first:pl-0 md:last:pr-0 text-center md:text-left">
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

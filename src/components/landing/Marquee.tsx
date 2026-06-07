import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: React.ReactNode[];
  reverse?: boolean;
  speed?: number;
  className?: string;
}

export function Marquee({ items, reverse = false, speed = 40, className }: MarqueeProps) {
  const duration = `${speed}s`;
  return (
    <div className={cn("relative flex overflow-hidden [--gap:1.5rem] py-3", className)}>
      {/* left fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
      {/* right fade */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex min-w-full shrink-0 gap-[--gap]"
          style={{
            animation: `marquee-scroll ${duration} linear infinite`,
            animationDirection: reverse ? "reverse" : "normal",
          }}
          aria-hidden={i === 1}
        >
          {items.map((item, j) => (
            <div key={j} className="shrink-0">
              {item}
            </div>
          ))}
        </div>
      ))}

      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-100% - var(--gap))); }
        }
      `}</style>
    </div>
  );
}

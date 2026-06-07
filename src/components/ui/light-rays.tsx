import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface LightRaysProps {
  count?: number;
  color?: string;
  blur?: number;
  opacity?: number;
  speed?: number;
  className?: string;
}

const LightRays = ({
  count = 5,
  color = "hsl(30 12% 65% / 0.15)",
  blur = 30,
  opacity = 0.4,
  speed = 8,
  className,
}: LightRaysProps) => {
  const rays = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${10 + Math.random() * 80}%`,
        width: `${2 + Math.random() * 6}%`,
        delay: `${Math.random() * speed}s`,
        duration: `${speed + Math.random() * 4}s`,
        rotate: `${-3 + Math.random() * 6}deg`,
      })),
    [count, speed]
  );

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none z-0",
        className
      )}
    >
      {rays.map((ray, i) => (
        <div
          key={i}
          className="absolute top-0 h-full animate-[lightray_var(--ray-duration)_ease-in-out_var(--ray-delay)_infinite]"
          style={{
            left: ray.left,
            width: ray.width,
            "--ray-delay": ray.delay,
            "--ray-duration": ray.duration,
            opacity: 0,
            transform: `rotate(${ray.rotate})`,
            background: `linear-gradient(180deg, ${color} 0%, transparent 70%)`,
            filter: `blur(${blur}px)`,
          } as React.CSSProperties}
        />
      ))}

      <style>{`
        @keyframes lightray {
          0%, 100% { opacity: 0; }
          50% { opacity: ${opacity}; }
        }
      `}</style>
    </div>
  );
};

export { LightRays };

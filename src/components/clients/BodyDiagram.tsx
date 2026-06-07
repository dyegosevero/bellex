import React from "react";
import bodySvgUrl from "@/assets/grafico-corpo.svg";

interface Props {
  activeZone: number | null;
}

const CIRCLES: { num: number; cx: number; cy: number }[] = [
  { num: 1, cx: 351.53, cy: 522.91 },
  { num: 2, cx: 644.55, cy: 491.49 },
  { num: 3, cx: 494.85, cy: 655.88 },
  { num: 4, cx: 494.85, cy: 803.5 },
  { num: 5, cx: 424.18, cy: 960.93 },
  { num: 6, cx: 575.08, cy: 960.93 },
  { num: 7, cx: 453.84, cy: 1211 },
  { num: 8, cx: 550.35, cy: 1211 },
  { num: 9, cx: 477.86, cy: 1518.42 },
  { num: 10, cx: 523.55, cy: 1604.51 },
];

const SVG_X = 200;
const SVG_Y = 170;
const SVG_W = 620;
const SVG_H = 1600;
const R_PCT = (45.69 / SVG_W) * 100;

export const BodyDiagram: React.FC<Props> = ({ activeZone }) => {
  return (
    <div className="relative w-full" style={{ aspectRatio: `${SVG_W}/${SVG_H}`, minHeight: "500px" }}>
      <img src={bodySvgUrl} alt="Diagrama corporal" className="w-full h-full" draggable={false} />

      {CIRCLES.map((c) => {
        const isActive = activeZone === c.num;
        const left = ((c.cx - SVG_X) / SVG_W) * 100;
        const top = ((c.cy - SVG_Y) / SVG_H) * 100;
        return (
          <div
            key={c.num}
            className={`absolute flex items-center justify-center rounded-full pointer-events-none transition-colors duration-200`}
            style={{
              ...(isActive ? { animation: "zone-pulse 1.5s ease-in-out infinite" } : {}),
              width: `${R_PCT * 2}%`,
              height: `${(45.69 / SVG_H) * 100 * 2}%`,
              left: `${left}%`,
              top: `${top}%`,
              transform: "translate(-50%, -50%)",
              backgroundColor: isActive
                ? "hsl(38 70% 50%)"
                : "hsl(var(--muted-foreground) / 0.25)",
              border: isActive
                ? "2px solid hsl(38 70% 60%)"
                : "1.5px solid hsl(var(--muted-foreground) / 0.35)",
              boxShadow: isActive
                ? "0 0 12px 4px hsl(38 70% 50% / 0.4)"
                : "none",
            }}
          >
            <span
              className="font-bold"
              style={{
                fontSize: "clamp(8px, 1.2vw, 14px)",
                color: isActive ? "white" : "hsl(var(--muted-foreground))",
              }}
            >
              {c.num}
            </span>
          </div>
        );
      })}
    </div>
  );
};

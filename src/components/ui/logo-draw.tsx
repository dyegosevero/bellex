import { useEffect, useRef, useState, useId } from "react";
import { cn } from "@/lib/utils";

interface LogoDrawProps {
  size?: number;
  strokeColor?: string;
  fillColor?: string;
  drawDuration?: number;
  fillDuration?: number;
  fillDelay?: number;
  loop?: boolean;
  loopCount?: number;
  className?: string;
}

// Bellex logo paths — viewBox 0 0 1876.58 453.51
const BELLEX_PATHS = [
  // b — path
  "M83.4,0l.03,157.18c87.42-62.67,247.01-61.83,306.43,38.38,33.98,57.3,29.7,143.63-12.9,195.83-64.43,78.93-216.03,79.59-293.52,19.21l-.02,35.3-83.42-.02V0h83.4ZM178.93,164.5c-135.71,16.31-133.98,228.59,8.61,239.81,73.36,5.77,133.84-25.53,139.77-104.26,7.45-98.87-52.36-147.09-148.38-135.55Z",
  // e (first)
  "M827.62,298.33h-320.78c5.52,31.94,13.88,59.28,40.17,80.12,44.19,35.01,134.17,36.48,174.87-4.62,4.6-4.64,17.88-27.38,20.74-27.38h75.38c-26.96,102.87-169.13,120.5-257.29,98.5-187.73-46.85-183.09-287.8,10.17-324.76,62.24-11.9,143.08-7.2,194.12,33.86,45.77,36.83,58.39,87.49,62.62,144.28ZM737.8,256.63c5.47-130.02-227.88-120.48-227.76,0h227.76Z",
  // e (second)
  "M1475.6,298.33h-320.78c5.52,31.94,13.88,59.28,40.17,80.12,44.19,35.01,134.17,36.48,174.87-4.62,4.6-4.64,17.88-27.38,20.74-27.38h75.38c-26.96,102.87-169.13,120.5-257.29,98.5-187.73-46.85-183.09-287.8,10.17-324.76,62.24-11.9,143.08-7.2,194.12,33.86,45.77,36.83,58.39,87.49,62.62,144.28ZM1385.78,256.63c5.47-130.02-227.88-120.48-227.76,0h227.76Z",
  // x
  "M1854.13,121.9l-144.12,151.93,166.58,172.06h-97.84c-32.86-40.6-71.59-76.29-106.02-115.38-2.45-2.79-4.72-5.8-4.71-9.72-19.65,10.16-114.65,125.11-123.44,125.11h-88.22l163.37-172.06-147.33-151.93h97.84c11.48,12.29,91.55,103.66,99,102.41,13.87-9.52,83.44-102.41,90.27-102.41h94.63Z",
];

// l rects as paths
const BELLEX_RECTS = [
  { x: 850.08, y: 0, w: 83.4, h: 445.89 },
  { x: 965.56, y: 0, w: 83.4, h: 445.89 },
];

export const LogoDraw = ({
  size = 80,
  strokeColor = "hsl(var(--primary))",
  fillColor = "hsl(var(--primary))",
  drawDuration = 1800,
  fillDuration = 600,
  fillDelay = 200,
  loop = false,
  loopCount,
  className,
}: LogoDrawProps) => {
  const uid = useId().replace(/:/g, "");
  const pathRefs = useRef<(SVGPathElement | SVGRectElement | null)[]>([]);
  const [lengths, setLengths] = useState<number[] | null>(null);
  const [cycle, setCycle] = useState(0);

  const totalElements = BELLEX_PATHS.length + BELLEX_RECTS.length;

  useEffect(() => {
    const lens: number[] = [];
    pathRefs.current.forEach((el) => {
      if (el instanceof SVGPathElement) {
        lens.push(Math.ceil(el.getTotalLength()) + 1);
      } else if (el instanceof SVGRectElement) {
        const w = el.width?.baseVal?.value ?? 83.4;
        const h = el.height?.baseVal?.value ?? 445.89;
        lens.push(Math.ceil(2 * (w + h)) + 1);
      }
    });
    if (lens.length === totalElements) setLengths(lens);
  }, [totalElements]);

  const shouldLoop = loop || (loopCount !== undefined && loopCount > 1);
  useEffect(() => {
    if (!shouldLoop || !lengths) return;
    const total = drawDuration + fillDelay + fillDuration + 600;
    const timer = setInterval(() => {
      setCycle((c) => {
        const next = c + 1;
        if (loopCount !== undefined && next >= loopCount) {
          clearInterval(timer);
          return c;
        }
        return next;
      });
    }, total);
    return () => clearInterval(timer);
  }, [shouldLoop, lengths, drawDuration, fillDelay, fillDuration, loopCount]);

  const totalAnim = drawDuration + fillDelay + fillDuration;

  const keyframes = lengths
    ? lengths
        .map(
          (len, i) => `
      @keyframes draw-bellex-${uid}-${i} {
        0%   { stroke-dashoffset: ${len}; fill-opacity: 0; }
        ${((drawDuration / totalAnim) * 100).toFixed(1)}% { stroke-dashoffset: 0; fill-opacity: 0; }
        ${(((drawDuration + fillDelay) / totalAnim) * 100).toFixed(1)}% { stroke-dashoffset: 0; fill-opacity: 0; }
        100% { stroke-dashoffset: 0; fill-opacity: 1; }
      }`
        )
        .join("\n")
    : "";

  const elStyle = (i: number, len: number): React.CSSProperties => ({
    stroke: strokeColor,
    strokeWidth: 4,
    fill: fillColor,
    fillOpacity: 0,
    strokeDasharray: len,
    strokeDashoffset: len,
    animation: `draw-bellex-${uid}-${i} ${totalAnim}ms ease-in-out forwards`,
    animationDelay: `${(i / totalElements) * (drawDuration * 0.3)}ms`,
  });

  // aspect ratio: 1876.58 / 453.51 ≈ 4.14
  const width = size * 4.14;
  const height = size;

  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      {lengths && <style>{keyframes}</style>}
      <svg
        key={cycle}
        width={width}
        height={height}
        viewBox="0 0 1876.58 453.51"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* l rects */}
        {BELLEX_RECTS.map((r, i) => (
          <rect
            key={`rect-${i}`}
            ref={(el) => { pathRefs.current[i] = el; }}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            style={lengths ? elStyle(i, lengths[i]) : { opacity: 0 }}
          />
        ))}
        {/* b, e, e, x paths */}
        {BELLEX_PATHS.map((d, i) => (
          <path
            key={`path-${i}`}
            ref={(el) => { pathRefs.current[BELLEX_RECTS.length + i] = el; }}
            d={d}
            style={lengths ? elStyle(BELLEX_RECTS.length + i, lengths[BELLEX_RECTS.length + i]) : { opacity: 0 }}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
};

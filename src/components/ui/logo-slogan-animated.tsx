import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

interface Props {
  className?: string;
}

// Bellex logo paths — viewBox 0 0 1876.58 453.51
const PATHS = [
  "M83.4,0l.03,157.18c87.42-62.67,247.01-61.83,306.43,38.38,33.98,57.3,29.7,143.63-12.9,195.83-64.43,78.93-216.03,79.59-293.52,19.21l-.02,35.3-83.42-.02V0h83.4ZM178.93,164.5c-135.71,16.31-133.98,228.59,8.61,239.81,73.36,5.77,133.84-25.53,139.77-104.26,7.45-98.87-52.36-147.09-148.38-135.55Z",
  "M827.62,298.33h-320.78c5.52,31.94,13.88,59.28,40.17,80.12,44.19,35.01,134.17,36.48,174.87-4.62,4.6-4.64,17.88-27.38,20.74-27.38h75.38c-26.96,102.87-169.13,120.5-257.29,98.5-187.73-46.85-183.09-287.8,10.17-324.76,62.24-11.9,143.08-7.2,194.12,33.86,45.77,36.83,58.39,87.49,62.62,144.28ZM737.8,256.63c5.47-130.02-227.88-120.48-227.76,0h227.76Z",
  "M1475.6,298.33h-320.78c5.52,31.94,13.88,59.28,40.17,80.12,44.19,35.01,134.17,36.48,174.87-4.62,4.6-4.64,17.88-27.38,20.74-27.38h75.38c-26.96,102.87-169.13,120.5-257.29,98.5-187.73-46.85-183.09-287.8,10.17-324.76,62.24-11.9,143.08-7.2,194.12,33.86,45.77,36.83,58.39,87.49,62.62,144.28ZM1385.78,256.63c5.47-130.02-227.88-120.48-227.76,0h227.76Z",
  "M1854.13,121.9l-144.12,151.93,166.58,172.06h-97.84c-32.86-40.6-71.59-76.29-106.02-115.38-2.45-2.79-4.72-5.8-4.71-9.72-19.65,10.16-114.65,125.11-123.44,125.11h-88.22l163.37-172.06-147.33-151.93h97.84c11.48,12.29,91.55,103.66,99,102.41,13.87-9.52,83.44-102.41,90.27-102.41h94.63Z",
];

export function LogoSloganAnimated({ className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const elements = svg.querySelectorAll("path, rect");

    gsap.set(elements, {
      fillOpacity: 0,
      opacity: 0,
      scale: 1.1,
      transformOrigin: "center center",
      filter: "blur(8px)",
    });

    const tl = gsap.timeline();
    tl.to(elements, {
      opacity: 1,
      fillOpacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 0.7,
      ease: "power2.out",
      stagger: 0.08,
    });

    return () => { tl.kill(); };
  }, []);

  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <svg
        ref={svgRef}
        viewBox="0 0 1876.58 453.51"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-48"
        style={{ overflow: "visible" }}
      >
        {/* l — rects */}
        <rect x="850.08" y="0" width="83.4" height="445.89" fill="currentColor" />
        <rect x="965.56" y="0" width="83.4" height="445.89" fill="currentColor" />
        {/* b, e, e, x — paths */}
        {PATHS.map((d, i) => (
          <path key={i} d={d} fill="currentColor" />
        ))}
      </svg>
    </div>
  );
}

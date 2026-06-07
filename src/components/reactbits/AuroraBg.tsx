// Pure CSS aurora — no WebGL, no OGL, works in all browsers
// Inspired by ReactBits SoftAurora but implemented with CSS keyframes
import { useEffect, useRef } from "react";

interface AuroraBgProps {
  className?: string;
  color1?: string;
  color2?: string;
  color3?: string;
}

export default function AuroraBg({
  className = "",
  color1 = "hsl(10 75% 77% / 0.35)",   // salmon
  color2 = "hsl(340 60% 70% / 0.20)",  // rose
  color3 = "hsl(20 50% 60% / 0.15)",   // peach
}: AuroraBgProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[#0c0a09]" />

      {/* Aurora blobs */}
      <div
        className="aurora-blob aurora-blob-1"
        style={{ "--c": color1 } as React.CSSProperties}
      />
      <div
        className="aurora-blob aurora-blob-2"
        style={{ "--c": color2 } as React.CSSProperties}
      />
      <div
        className="aurora-blob aurora-blob-3"
        style={{ "--c": color3 } as React.CSSProperties}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 aurora-grid opacity-[0.04]" />

      {/* Bottom fade to white for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-white" />
    </div>
  );
}

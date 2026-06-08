import { motion, useMotionValue, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import { useRef } from "react";

interface ShimmerButtonProps {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function ShimmerButton({ to, onClick, children, className = "" }: ShimmerButtonProps) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-30, 30], [6, -6]);
  const rotateY = useTransform(x, [-60, 60], [-6, 6]);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const shimmerVariants = {
    rest: { x: "-100%", opacity: 0 },
    hover: { x: "100%", opacity: 1, transition: { duration: 0.5, ease: "easeInOut" as const } },
  };

  const glowVariants = {
    rest: { opacity: 0 },
    hover: { opacity: 1, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.97 }}
      animate="rest"
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      <motion.div variants={{ hover: { scale: 1.04 }, rest: { scale: 1 } }}>
        {to ? (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={to}
          className={`relative inline-flex items-center gap-2 bg-primary text-white font-medium rounded-xl overflow-hidden ${className}`}
        >
          {/* shimmer sweep */}
          <motion.span
            className="pointer-events-none absolute inset-0"
            variants={shimmerVariants}
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)",
            }}
          />
          {/* glow behind */}
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-xl"
            variants={glowVariants}
            style={{
              boxShadow: "0 0 28px 4px hsl(10 75% 67% / 0.45)",
            }}
          />
          <span className="relative z-10 flex items-center gap-2">{children}</span>
        </Link>
        ) : (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          onClick={onClick}
          className={`relative inline-flex items-center gap-2 bg-primary text-white font-medium rounded-xl overflow-hidden ${className}`}
        >
          <motion.span className="pointer-events-none absolute inset-0" variants={shimmerVariants} style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)" }} />
          <motion.span className="pointer-events-none absolute inset-0 rounded-xl" variants={glowVariants} style={{ boxShadow: "0 0 28px 4px hsl(10 75% 67% / 0.45)" }} />
          <span className="relative z-10 flex items-center gap-2">{children}</span>
        </button>
        )}
      </motion.div>
    </motion.div>
  );
}

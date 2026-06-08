import { motion } from "motion/react";
import { useLocation } from "react-router-dom";

const FULL_SCREEN_ROUTES = ["/dashboard", "/resumo", "/pipeline", "/mensagens"];

const variants = {
  initial: { opacity: 0, y: 18, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.42, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(3px)",
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
  },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isFullScreen = FULL_SCREEN_ROUTES.includes(location.pathname);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        willChange: "opacity, transform, filter",
        ...(isFullScreen
          ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }
          : {}),
      }}
    >
      {children}
    </motion.div>
  );
}

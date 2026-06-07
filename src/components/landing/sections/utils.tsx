import { useEffect, useRef } from "react";
import gsap from "gsap";

function useOnVisible(ref: React.RefObject<Element | null>, fn: () => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fn(); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
}

export function CountUp({ to, suffix = "", duration = 2 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const obj = { val: 0 };
      gsap.to(obj, { val: to, duration, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; } });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, suffix, duration]);
  return <span ref={ref}>0{suffix}</span>;
}

export function FadeUp({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useOnVisible(ref, () => setTimeout(() => ref.current?.classList.add("is-visible"), delay));
  return <div ref={ref} className={`lp-fade-up ${className}`}>{children}</div>;
}

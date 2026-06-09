import { useEffect, useRef, type ReactNode } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

interface SlidingTabsListProps {
  children: ReactNode;
  className?: string;
}

/**
 * Drop-in replacement for Shadcn TabsList that adds a sliding pill.
 * Works with Radix TabsTrigger — observes `data-state="active"` mutations.
 * CSS is defined in index.css (.t-tabs, .t-tab, .t-tabs-pill).
 * Add className="t-tab" to each TabsTrigger inside this component.
 */
export function SlidingTabsList({ children, className }: SlidingTabsListProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  const movePill = (animate: boolean) => {
    const bar = barRef.current;
    const pill = pillRef.current;
    if (!bar || !pill) return;
    const active = bar.querySelector<HTMLElement>('[data-state="active"]');
    if (!active) return;
    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${active.offsetLeft}px)`;
      pill.style.width = `${active.offsetWidth}px`;
      void pill.offsetWidth; // force reflow
      pill.style.transition = prev;
    } else {
      pill.style.transform = `translateX(${active.offsetLeft}px)`;
      pill.style.width = `${active.offsetWidth}px`;
    }
  };

  useEffect(() => {
    // First paint — no animation so pill starts at correct position
    requestAnimationFrame(() => movePill(false));

    const bar = barRef.current;
    if (!bar) return;

    // Watch for Radix data-state changes on any child
    const mo = new MutationObserver(() => movePill(true));
    mo.observe(bar, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state"],
    });

    const onResize = () => movePill(false);
    window.addEventListener("resize", onResize);

    return () => {
      mo.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <TabsPrimitive.List
      ref={barRef}
      className={cn("t-tabs", className)}
    >
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {children}
    </TabsPrimitive.List>
  );
}

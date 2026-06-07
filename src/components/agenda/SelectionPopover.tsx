import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Ban } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SelectionPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { x: number; y: number };
  onNewAppointment: () => void;
  onBlockTime: () => void;
}

export function SelectionPopover({ open, onOpenChange, position, onNewAppointment, onBlockTime }: SelectionPopoverProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || !menuRef.current || isMobile) {
      setAdjustedPos(position);
      return;
    }
    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    let x = position.x;
    let y = position.y;

    const halfW = rect.width / 2;
    if (x - halfW < pad) x = halfW + pad;
    if (x + halfW > window.innerWidth - pad) x = window.innerWidth - halfW - pad;

    if (y - rect.height < pad) y = rect.height + pad;
    if (y > window.innerHeight - pad) y = window.innerHeight - pad;

    setAdjustedPos({ x, y });
  }, [open, position, isMobile]);

  if (!open) return null;

  const menuButtons = (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2.5 text-sm font-semibold h-12 rounded-lg"
        onClick={() => { onOpenChange(false); onNewAppointment(); }}
      >
        <Plus className="w-4 h-4 text-primary" />
        Nova Marcação
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2.5 text-sm font-semibold h-12 rounded-lg"
        onClick={() => { onOpenChange(false); onBlockTime(); }}
      >
        <Ban className="w-4 h-4 text-muted-foreground" />
        Bloquear Marcações
      </Button>
    </>
  );

  // Mobile: bottom sheet style
  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-[49] bg-black/30 transition-opacity duration-300" onClick={() => onOpenChange(false)} />
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-8 duration-300 ease-out">
          <div className="bg-card border-t border-border rounded-t-2xl shadow-2xl p-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-1">
            {menuButtons}
          </div>
        </div>
      </>
    );
  }

  // Desktop: floating popover
  return (
    <>
      <div className="fixed inset-0 z-[49]" onClick={() => onOpenChange(false)} />
      <div
        ref={menuRef}
        className="fixed z-50"
        style={{ left: adjustedPos.x, top: adjustedPos.y, transform: "translate(-50%, -100%)" }}
      >
        <div className="bg-card border border-border rounded-xl shadow-lg p-2 space-y-1.5 min-w-[220px] animate-in fade-in-0 zoom-in-95 duration-150">
          {menuButtons}
        </div>
      </div>
    </>
  );
}

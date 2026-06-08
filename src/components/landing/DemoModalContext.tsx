import { createContext, useContext, useState, ReactNode } from "react";
import { DemoModal } from "./DemoModal";

const DemoModalContext = createContext<{ openDemo: () => void }>({ openDemo: () => {} });

export function DemoModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DemoModalContext.Provider value={{ openDemo: () => setOpen(true) }}>
      {children}
      <DemoModal open={open} onOpenChange={setOpen} />
    </DemoModalContext.Provider>
  );
}

export const useDemoModal = () => useContext(DemoModalContext);

import { useState } from "react";
import logoColor from "@/assets/logo-color.png";
import { DSNavigation } from "@/components/design-system/DSNavigation";
import { DSHero } from "@/components/design-system/DSHero";
import { DSBrandFoundation } from "@/components/design-system/DSBrandFoundation";
import { DSColors } from "@/components/design-system/DSColors";
import { DSTypography } from "@/components/design-system/DSTypography";
import { DSSpacing } from "@/components/design-system/DSSpacing";
import { DSComponents } from "@/components/design-system/DSComponents";
import { DSAnimations } from "@/components/design-system/DSAnimations";
import { DSIcons } from "@/components/design-system/DSIcons";
import { DSCharts } from "@/components/design-system/DSCharts";
import { DSAccessibility } from "@/components/design-system/DSAccessibility";
import { DSExamples } from "@/components/design-system/DSExamples";

const sections = [
  { id: "brand", label: "Fundamentos" },
  { id: "colors", label: "Cores" },
  { id: "typography", label: "Tipografia" },
  { id: "spacing", label: "Espaçamento" },
  { id: "components", label: "Componentes" },
  { id: "animations", label: "Animações" },
  { id: "icons", label: "Ícones" },
  { id: "charts", label: "Gráficos" },
  { id: "accessibility", label: "Acessibilidade" },
  { id: "examples", label: "Exemplos" },
];

const Index = () => {
  const [activeSection, setActiveSection] = useState("brand");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <DSNavigation sections={sections} activeSection={activeSection} onNavigate={scrollToSection} />
      <DSHero />
      <div className="max-w-7xl mx-auto">
        <div id="brand"><DSBrandFoundation /></div>
        <div id="colors"><DSColors /></div>
        <div id="typography"><DSTypography /></div>
        <div id="spacing"><DSSpacing /></div>
        <div id="components"><DSComponents /></div>
        <div id="animations"><DSAnimations /></div>
        <div id="icons"><DSIcons /></div>
        <div id="charts"><DSCharts /></div>
        <div id="accessibility"><DSAccessibility /></div>
        <div id="examples"><DSExamples /></div>
      </div>
      <footer className="py-12 flex flex-col items-center gap-3 border-t border-border">
        <img src={logoColor} alt="Bellex" className="h-5 w-auto opacity-60" />
        <p className="text-muted-foreground text-xs">Design System — Documentação v1.0</p>
      </footer>
    </div>
  );
};

export default Index;

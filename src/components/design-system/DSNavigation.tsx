import logoColor from "@/assets/logo-color.png";

interface Props {
  sections: { id: string; label: string }[];
  activeSection: string;
  onNavigate: (id: string) => void;
}

export const DSNavigation = ({ sections, activeSection, onNavigate }: Props) => {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-8 overflow-x-auto">
        <img src={logoColor} alt="Bellex" className="h-6 w-auto shrink-0" />
        <div className="flex gap-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id)}
              className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all duration-200 whitespace-nowrap ${
                activeSection === s.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

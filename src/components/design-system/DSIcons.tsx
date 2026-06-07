import { 
  User, Calendar, Search, Settings, Bell, ChevronRight, 
  Plus, Edit, Trash2, Eye, Download, Upload, Filter, 
  BarChart3, Heart, Clock, Check, X, AlertTriangle, 
  Phone, Mail, MapPin, Star, FileText, Camera
} from "lucide-react";

export const DSIcons = () => {
  const iconSets = [
    { category: "Navegação", icons: [
      { Icon: Search, name: "Search" }, { Icon: Settings, name: "Settings" }, 
      { Icon: Bell, name: "Bell" }, { Icon: ChevronRight, name: "ChevronRight" },
      { Icon: Filter, name: "Filter" },
    ]},
    { category: "Ações", icons: [
      { Icon: Plus, name: "Plus" }, { Icon: Edit, name: "Edit" }, 
      { Icon: Trash2, name: "Trash2" }, { Icon: Eye, name: "Eye" },
      { Icon: Download, name: "Download" }, { Icon: Upload, name: "Upload" },
    ]},
    { category: "CRM / Clínica", icons: [
      { Icon: User, name: "User" }, { Icon: Calendar, name: "Calendar" }, 
      { Icon: Heart, name: "Heart" }, { Icon: BarChart3, name: "BarChart3" },
      { Icon: Phone, name: "Phone" }, { Icon: Mail, name: "Mail" },
      { Icon: MapPin, name: "MapPin" }, { Icon: Star, name: "Star" },
      { Icon: FileText, name: "FileText" }, { Icon: Camera, name: "Camera" },
    ]},
    { category: "Status", icons: [
      { Icon: Check, name: "Check" }, { Icon: X, name: "X" }, 
      { Icon: AlertTriangle, name: "AlertTriangle" }, { Icon: Clock, name: "Clock" },
    ]},
  ];

  const drawAnimations = [
    { className: "icon-draw", label: "Draw", desc: "Redesenha o ícone no hover", Icon: Heart },
    { className: "icon-draw-in", label: "Draw In", desc: "Aparece desenhando progressivamente", Icon: Star },
    { className: "icon-draw-loop", label: "Draw Loop", desc: "Animação contínua de desenho", Icon: Settings },
    { className: "icon-rotate-draw", label: "Rotate Draw", desc: "Rotação + redesenho combinados", Icon: Camera },
    { className: "icon-fill-draw", label: "Fill Draw", desc: "Desenha e preenche suavemente", Icon: Bell },
  ];

  return (
    <section className="ds-section border-t border-border">
      <span className="text-xs text-primary tracking-widest uppercase font-medium">07</span>
      <h2 className="ds-section-title mt-2">Sistema de Ícones</h2>
      <p className="ds-section-subtitle">Lucide Icons — estilo outline fino, consistente e acessível.</p>

      <div className="ds-card mb-8">
        <h3 className="font-heading text-lg font-medium mb-4">Especificações</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Biblioteca</p>
            <p className="text-sm font-medium">Lucide React</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Estilo</p>
            <p className="text-sm font-medium">Outline (strokeWidth: 1.75)</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tamanho padrão</p>
            <p className="text-sm font-medium">20px (h-5 w-5)</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tamanhos</p>
            <p className="text-sm font-medium">16, 20, 24px</p>
          </div>
        </div>
      </div>

      {iconSets.map((set) => (
        <div key={set.category} className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">{set.category}</h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {set.icons.map(({ Icon, name }) => (
              <div key={name} className="icon-draw flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
                <span className="text-[10px] text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Sizes */}
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Escala de Tamanhos</h3>
      <div className="flex items-end gap-6 mb-10">
        {[{ size: "h-4 w-4", label: "16px (sm)" }, { size: "h-5 w-5", label: "20px (default)" }, { size: "h-6 w-6", label: "24px (lg)" }].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2">
            <User className={`${s.size} text-foreground`} strokeWidth={1.75} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Animated Icons — Stroke Draw */}
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Animações de Ícones — Stroke Draw</h3>
      <p className="text-xs text-muted-foreground mb-4">Passe o mouse sobre cada ícone para ver o efeito de desenho.</p>
      <div className="grid md:grid-cols-5 gap-4">
        {drawAnimations.map(({ className, label, desc, Icon }) => (
          <div key={className} className="ds-card text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{label}</p>
            <div className={`${className} inline-flex p-4 rounded-lg bg-muted/30 cursor-pointer`}>
              <Icon className="h-8 w-8 text-foreground" strokeWidth={1.75} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">.{className}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

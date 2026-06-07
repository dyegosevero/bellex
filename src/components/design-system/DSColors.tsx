const ColorSwatch = ({
  name,
  variable,
  hex,
  usage,
  className,
  bordered = false,
}: {
  name: string;
  variable: string;
  hex: string;
  usage: string;
  className: string;
  bordered?: boolean;
}) => (
  <div className="flex flex-col">
    <div className={`ds-swatch ${className} ${bordered ? "border border-border" : ""}`} />
    <p className="text-sm font-normal mt-3">{name}</p>
    <p className="text-xs text-muted-foreground font-mono">{variable}</p>
    <p className="text-xs text-muted-foreground font-mono">{hex}</p>
    <p className="text-xs text-muted-foreground mt-1">{usage}</p>
  </div>
);

export const DSColors = () => {
  return (
    <section className="ds-section border-t border-border">
      <span className="text-xs text-primary tracking-widest uppercase font-normal">02</span>
      <h2 className="ds-section-title mt-2">Paleta de Cores</h2>
      <p className="ds-section-subtitle">Salmon como cor de marca, warm off-white como base, carvão escuro para texto.</p>

      {/* Brand Core */}
      <h3 className="font-heading text-lg font-light mb-4">Cores de Marca</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <ColorSwatch name="Salmon (Primary)" variable="--primary" hex="#F0A898" usage="Botões, links, CTAs, estados ativos" className="bg-primary" />
        <ColorSwatch name="Salmon Dark" variable="--brand-salmon-dark" hex="#D98A78" usage="Hover do primary, ênfase" className="bg-brand-salmon-dark" />
        <ColorSwatch name="Blush" variable="--brand-blush" hex="#FDE8E3" usage="Fundo de accent, badges" className="bg-brand-blush" bordered />
        <ColorSwatch name="Foreground" variable="--foreground" hex="#1E1410" usage="Texto principal, títulos" className="bg-foreground" />
      </div>

      {/* Neutrals */}
      <h3 className="font-heading text-lg font-light mb-4">Neutros & Fundos</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
        <ColorSwatch name="Background" variable="--background" hex="#FAF8F6" usage="Fundo global do app" className="bg-background" bordered />
        <ColorSwatch name="Card" variable="--card" hex="#FFFFFF" usage="Cards, painéis, modais" className="bg-card" bordered />
        <ColorSwatch name="Cream" variable="--brand-cream" hex="#F5F0EE" usage="Sidebar, superfícies secundárias" className="bg-brand-cream" bordered />
        <ColorSwatch name="Muted" variable="--muted" hex="#F0EBE9" usage="Áreas desativadas, hover" className="bg-muted" bordered />
        <ColorSwatch name="Border" variable="--border" hex="#EAE0DD" usage="Bordas de cards, inputs, divisores" className="bg-border" bordered />
      </div>

      {/* States */}
      <h3 className="font-heading text-lg font-light mb-4">Estados do Sistema</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <ColorSwatch name="Sucesso" variable="--success" hex="#22C55E" usage="Confirmações, agendamentos realizados" className="bg-success" />
        <ColorSwatch name="Alerta" variable="--warning" hex="#F59E0B" usage="Avisos, pagamentos pendentes" className="bg-warning" />
        <ColorSwatch name="Erro" variable="--destructive" hex="#EF4444" usage="Erros, cancelamentos, exclusões" className="bg-destructive" />
        <ColorSwatch name="Info" variable="--info" hex="#6B96C8" usage="Informações, links secundários" className="bg-info" />
      </div>

      {/* Gradients */}
      <h3 className="font-heading text-lg font-light mb-4">Gradientes</h3>
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div>
          <div className="h-24 rounded-xl gradient-brand" />
          <p className="text-sm font-normal mt-2">Brand Gradient</p>
          <p className="text-xs text-muted-foreground font-mono">Salmon → Salmon Dark (135°)</p>
        </div>
        <div>
          <div className="h-24 rounded-xl gradient-warm" />
          <p className="text-sm font-normal mt-2">Warm Gradient</p>
          <p className="text-xs text-muted-foreground font-mono">Blush → Background (180°)</p>
        </div>
        <div>
          <div className="h-24 rounded-xl gradient-surface border border-border" />
          <p className="text-sm font-normal mt-2">Surface Gradient</p>
          <p className="text-xs text-muted-foreground font-mono">White → Cream (180°)</p>
        </div>
      </div>

      {/* Opacity scale */}
      <h3 className="font-heading text-lg font-light mb-4">Escala de Opacidade — Primary</h3>
      <div className="flex gap-4 items-end">
        {[100, 80, 60, 40, 20, 10, 5].map((op) => (
          <div key={op} className="text-center">
            <div className="w-12 h-12 rounded-lg bg-primary" style={{ opacity: op / 100 }} />
            <p className="text-xs text-muted-foreground mt-2">{op}%</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const DSSpacing = () => {
  const scale = [
    { name: "4xs", px: 2, rem: "0.125", usage: "Bordas, separadores mínimos" },
    { name: "3xs", px: 4, rem: "0.25", usage: "Ícone-texto, gaps mínimos" },
    { name: "2xs", px: 8, rem: "0.5", usage: "Padding interno de badges" },
    { name: "xs", px: 12, rem: "0.75", usage: "Gap entre elementos inline" },
    { name: "sm", px: 16, rem: "1", usage: "Padding de inputs, cards internos" },
    { name: "md", px: 24, rem: "1.5", usage: "Padding de cards, margens entre grupos" },
    { name: "lg", px: 32, rem: "2", usage: "Margens de seção" },
    { name: "xl", px: 48, rem: "3", usage: "Espaçamento entre seções" },
    { name: "2xl", px: 64, rem: "4", usage: "Padding de hero, seções maiores" },
    { name: "3xl", px: 96, rem: "6", usage: "Margens de página" },
  ];

  const breakpoints = [
    { name: "sm", width: "640px", usage: "Mobile landscape" },
    { name: "md", width: "768px", usage: "Tablets" },
    { name: "lg", width: "1024px", usage: "Desktop pequeno" },
    { name: "xl", width: "1280px", usage: "Desktop padrão" },
    { name: "2xl", width: "1400px", usage: "Desktop wide (container max)" },
  ];

  return (
    <section className="ds-section border-t border-border">
      <span className="text-xs text-primary tracking-widest uppercase font-medium">04</span>
      <h2 className="ds-section-title mt-2">Sistema de Espaçamento</h2>
      <p className="ds-section-subtitle">Base de 4px com escala consistente para margens, paddings e gaps.</p>

      {/* Scale Visual */}
      <h3 className="font-heading text-lg font-medium mb-4">Escala de Espaçamento</h3>
      <div className="space-y-3 mb-12">
        {scale.map((s) => (
          <div key={s.name} className="flex items-center gap-4">
            <span className="text-xs font-mono text-muted-foreground w-12">{s.name}</span>
            <div className="bg-primary/20 rounded" style={{ width: `${s.px * 2}px`, height: 16 }} />
            <span className="text-xs font-mono text-muted-foreground w-16">{s.px}px</span>
            <span className="text-xs font-mono text-muted-foreground w-16">{s.rem}rem</span>
            <span className="text-xs text-muted-foreground">{s.usage}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <h3 className="font-heading text-lg font-medium mb-4">Grid System</h3>
      <div className="ds-card mb-8">
        <p className="text-sm text-muted-foreground mb-4">Grid de 12 colunas com gutter de 24px. Container máximo de 1400px centralizado.</p>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-10 bg-primary/15 rounded flex items-center justify-center text-xs text-muted-foreground font-mono">
              {i + 1}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-1 mt-2">
          <div className="col-span-3 h-8 bg-primary/10 rounded flex items-center justify-center text-xs text-muted-foreground">3</div>
          <div className="col-span-6 h-8 bg-primary/20 rounded flex items-center justify-center text-xs text-muted-foreground">6</div>
          <div className="col-span-3 h-8 bg-primary/10 rounded flex items-center justify-center text-xs text-muted-foreground">3</div>
        </div>
        <div className="grid grid-cols-12 gap-1 mt-2">
          <div className="col-span-4 h-8 bg-primary/10 rounded flex items-center justify-center text-xs text-muted-foreground">4</div>
          <div className="col-span-8 h-8 bg-primary/20 rounded flex items-center justify-center text-xs text-muted-foreground">8</div>
        </div>
      </div>

      {/* Breakpoints */}
      <h3 className="font-heading text-lg font-medium mb-4">Breakpoints</h3>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Token</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Largura</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Uso</th>
            </tr>
          </thead>
          <tbody>
            {breakpoints.map((b, i) => (
              <tr key={b.name} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                <td className="p-4 text-sm font-mono">{b.name}</td>
                <td className="p-4 text-sm text-muted-foreground font-mono">{b.width}</td>
                <td className="p-4 text-sm text-muted-foreground">{b.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

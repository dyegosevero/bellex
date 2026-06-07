import { Check, X } from "lucide-react";

export const DSAccessibility = () => {
  const rules = [
    { rule: "Contraste mínimo texto/fundo", value: "4.5:1 (WCAG AA)", pass: true },
    { rule: "Contraste texto grande", value: "3:1 (WCAG AA)", pass: true },
    { rule: "Tamanho mínimo de texto", value: "12px (0.75rem)", pass: true },
    { rule: "Alvo mínimo de toque", value: "44 × 44px", pass: true },
    { rule: "Focus ring visível", value: "2px ring com offset", pass: true },
    { rule: "Navegação por teclado", value: "Tab order lógico", pass: true },
    { rule: "Labels em inputs", value: "Sempre visíveis ou aria-label", pass: true },
    { rule: "Alt text em imagens", value: "Descritivo e contextual", pass: true },
    { rule: "Roles ARIA", value: "Em componentes customizados", pass: true },
    { rule: "Reduced motion", value: "prefers-reduced-motion respeitado", pass: true },
  ];

  return (
    <section className="ds-section border-t border-border">
      <span className="text-xs text-primary tracking-widest uppercase font-medium">09</span>
      <h2 className="ds-section-title mt-2">Acessibilidade</h2>
      <p className="ds-section-subtitle">Conformidade com WCAG 2.1 AA para garantir inclusão e usabilidade.</p>

      <div className="border border-border rounded-lg overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Regra</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Especificação</th>
              <th className="text-center p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <tr key={r.rule} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                <td className="p-4 text-sm font-medium">{r.rule}</td>
                <td className="p-4 text-sm text-muted-foreground">{r.value}</td>
                <td className="p-4 text-center">
                  {r.pass ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/10 text-success"><Check className="h-3.5 w-3.5" /></span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/10 text-destructive"><X className="h-3.5 w-3.5" /></span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Focus example */}
      <h3 className="font-heading text-lg font-medium mb-4">Estado de Foco</h3>
      <div className="ds-card">
        <p className="text-sm text-muted-foreground mb-4">Todos os elementos interativos devem ter um focus ring visível ao navegar por teclado.</p>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Pressione Tab
          </button>
          <input className="px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Focus neste input" />
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-mono">ring-2 ring-ring ring-offset-2 · Cor: var(--ring) · Offset: 2px</p>
      </div>
    </section>
  );
};

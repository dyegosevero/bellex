export const DSTypography = () => {
  const hierarchy = [
    { tag: "Display", font: "Manrope", weight: "800 (ExtraBold)", size: "72px / 4.5rem", lineHeight: "1.0", tracking: "-0.04em", usage: "Hero, landing pages, grandes destaques" },
    { tag: "H1", font: "Manrope", weight: "800 (ExtraBold)", size: "48px / 3rem", lineHeight: "1.1", tracking: "-0.03em", usage: "Títulos de página" },
    { tag: "H2", font: "Manrope", weight: "700 (Bold)", size: "32px / 2rem", lineHeight: "1.2", tracking: "-0.02em", usage: "Títulos de seção" },
    { tag: "H3", font: "Manrope", weight: "700 (Bold)", size: "24px / 1.5rem", lineHeight: "1.3", tracking: "-0.01em", usage: "Subtítulos, cards" },
    { tag: "H4", font: "Manrope", weight: "600 (Semibold)", size: "18px / 1.125rem", lineHeight: "1.4", tracking: "0", usage: "Labels de seção, grupos" },
    { tag: "Body", font: "Manrope", weight: "400 (Regular)", size: "15px / 0.9375rem", lineHeight: "1.6", tracking: "0", usage: "Texto de conteúdo principal" },
    { tag: "Body SM", font: "Manrope", weight: "400 (Regular)", size: "13px / 0.8125rem", lineHeight: "1.5", tracking: "0", usage: "Texto secundário, tabelas" },
    { tag: "Caption", font: "Manrope", weight: "600 (Semibold)", size: "12px / 0.75rem", lineHeight: "1.4", tracking: "0.04em", usage: "Labels de dados, metadados" },
    { tag: "Overline", font: "Manrope", weight: "700 (Bold)", size: "11px / 0.688rem", lineHeight: "1.4", tracking: "0.12em", usage: "Categorias, seções (UPPERCASE)" },
  ];

  return (
    <section className="ds-section border-t border-border">
      <span className="text-xs text-primary tracking-widest uppercase font-normal">03</span>
      <h2 className="ds-section-title mt-2">Tipografia</h2>
      <p className="ds-section-subtitle">Manrope em todos os contextos — uma fonte, múltiplos pesos. Simples e consistente.</p>

      {/* Font showcase */}
      <div className="ds-card mb-12">
        <p className="text-xs text-primary tracking-widest uppercase font-normal mb-6">Manrope — Família completa</p>
        <div className="space-y-3">
          {[
            { weight: "200", label: "ExtraLight" },
            { weight: "300", label: "Light" },
            { weight: "400", label: "Regular" },
            { weight: "500", label: "Medium" },
            { weight: "600", label: "SemiBold" },
            { weight: "700", label: "Bold" },
            { weight: "800", label: "ExtraBold" },
          ].map(({ weight, label }) => (
            <div key={weight} className="flex items-baseline gap-6">
              <span className="text-xs text-muted-foreground w-24 font-mono">{weight} · {label}</span>
              <span className="text-2xl text-foreground" style={{ fontWeight: weight }}>
                bellex — Gestão de Clínicas
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hierarchy Table */}
      <h3 className="font-heading text-lg font-light mb-4">Hierarquia Completa</h3>
      <div className="border border-border rounded-xl overflow-hidden mb-12">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-4 text-xs font-normal text-muted-foreground uppercase tracking-wider">Elemento</th>
              <th className="text-left p-4 text-xs font-normal text-muted-foreground uppercase tracking-wider">Peso</th>
              <th className="text-left p-4 text-xs font-normal text-muted-foreground uppercase tracking-wider">Tamanho</th>
              <th className="text-left p-4 text-xs font-normal text-muted-foreground uppercase tracking-wider">Leading</th>
              <th className="text-left p-4 text-xs font-normal text-muted-foreground uppercase tracking-wider hidden md:table-cell">Uso</th>
            </tr>
          </thead>
          <tbody>
            {hierarchy.map((h, i) => (
              <tr key={h.tag} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                <td className="p-4 font-normal text-sm">{h.tag}</td>
                <td className="p-4 text-sm text-muted-foreground">{h.weight}</td>
                <td className="p-4 text-sm text-muted-foreground font-mono text-xs">{h.size}</td>
                <td className="p-4 text-sm text-muted-foreground">{h.lineHeight}</td>
                <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{h.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Examples */}
      <h3 className="font-heading text-lg font-light mb-4">Exemplos Visuais</h3>
      <div className="ds-card space-y-6">
        <div className="text-[72px] font-light tracking-tight leading-none text-foreground">bellex</div>
        <h1 className="font-heading text-5xl font-light tracking-tight">Gestão de Clínicas de Estética</h1>
        <h2 className="font-heading text-3xl font-light">Agenda & Atendimentos</h2>
        <h3 className="font-heading text-2xl font-light">Perfil do Cliente</h3>
        <h4 className="font-heading text-lg font-normal">Dados do Procedimento</h4>
        <p className="text-base leading-relaxed text-muted-foreground">Body — A cliente Maria Silva realizou sua primeira consulta em janeiro de 2026. O protocolo inclui três sessões de limpeza de pele com intervalo de 30 dias.</p>
        <p className="text-sm text-muted-foreground">Body SM — Última atualização: 03 de junho de 2026 · Especialista: Dr. Paulo Mendes</p>
        <p className="text-xs text-muted-foreground tracking-wider font-normal">Caption — Último agendamento: 15/05/2026</p>
        <p className="text-[11px] text-muted-foreground tracking-widest uppercase font-light">Overline — Status do Atendimento</p>
      </div>
    </section>
  );
};

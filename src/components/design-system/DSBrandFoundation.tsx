export const DSBrandFoundation = () => {
  return (
    <section className="ds-section">
      <span className="text-xs text-primary tracking-widest uppercase font-normal">01</span>
      <h2 className="ds-section-title mt-2">Fundamentos da Marca</h2>
      <p className="ds-section-subtitle">A essência visual e emocional que guia todas as decisões de design Bellex.</p>

      {/* Essence */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="ds-card">
          <h3 className="font-heading text-xl font-light mb-4">Essência da Marca</h3>
          <p className="text-muted-foreground leading-relaxed text-sm">
            Bellex é um sistema SaaS whitelabel para clínicas de estética. A identidade combina
            <strong className="text-foreground"> praticidade moderna</strong> com a sofisticação
            do setor de beleza — salmon como cor de marca, tipografia Manrope bold e bordas
            arredondadas que transmitem acolhimento sem perder profissionalismo.
          </p>
        </div>
        <div className="ds-card">
          <h3 className="font-heading text-xl font-light mb-4">Personalidade</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "Moderno sem ser frio — salmon aquece a interface",
              "Profissional sem ser engessado — bordas arredondadas",
              "Limpo e arejado — espaçamento generoso",
              "Bold nos títulos — presença e confiança",
              "Funcional acima de tudo — o usuário foca no trabalho",
            ].map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { title: "Clareza", desc: "Interface objetiva e direta" },
          { title: "Acolhimento", desc: "Salmon como cor principal" },
          { title: "Confiança", desc: "Tipografia bold e consistente" },
          { title: "Escala", desc: "Whitelabel para qualquer clínica" },
        ].map((v) => (
          <div key={v.title} className="text-center p-6 rounded-xl bg-secondary/50 border border-border">
            <p className="font-heading text-lg font-light text-foreground">{v.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Logo placeholder */}
      <h3 className="font-heading text-xl font-light mb-6">Logo — Bellex</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-foreground rounded-xl p-8 w-full flex items-center justify-center aspect-square">
            <span className="font-heading font-light text-4xl text-white tracking-tight">
              bellex<span className="text-primary">®</span>
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Fundo escuro</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white border border-border rounded-xl p-8 w-full flex items-center justify-center aspect-square">
            <span className="font-heading font-light text-4xl text-foreground tracking-tight">
              bellex<span className="text-primary">®</span>
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Fundo claro</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="bg-primary rounded-xl p-8 w-full flex items-center justify-center aspect-square">
            <span className="font-heading font-light text-4xl text-white tracking-tight">
              bellex®
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Fundo salmon</span>
        </div>
      </div>

      {/* Anti-guidelines */}
      <h3 className="font-heading text-xl font-light mb-6">O que Evitar</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          "Cores neon ou saturadas demais",
          "Fonte serifada ou script informal",
          "Sombras pesadas ou efeitos 3D",
          "Bordas arredondadas excessivas (full pill em campos)",
          "Gradientes multicoloridos ou vibrantes",
          "Fotos de banco de imagem genéricas",
          "Emojis em contexto profissional",
          "Fontes diferentes de Manrope no app",
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm text-destructive/80 bg-destructive/5 rounded-lg p-3 border border-destructive/10">
            <span className="text-destructive font-light">✕</span>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
};

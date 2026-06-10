import { BrandGrain } from "@/components/BrandGrain";
import { BRAND_GRAIN_PROPS, BRAND_COLORS } from "@/lib/brand";
import logoSvg from "@/assets/logo-svg.svg";
import logoColor from "@/assets/logo-color.png";
import logoWhite from "@/assets/logo-1x1-white.png";

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
        {/* Fundo escuro */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-foreground rounded-xl p-8 w-full flex items-center justify-center aspect-square">
            <img src={logoWhite} alt="Bellex logo" className="w-full max-w-[160px]" />
          </div>
          <span className="text-xs text-muted-foreground">Fundo escuro</span>
        </div>
        {/* Fundo claro */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white border border-border rounded-xl p-8 w-full flex items-center justify-center aspect-square">
            <img src={logoColor} alt="Bellex logo" className="w-full max-w-[160px]" />
          </div>
          <span className="text-xs text-muted-foreground">Fundo claro</span>
        </div>
        {/* Fundo salmon */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-primary rounded-xl p-8 w-full flex items-center justify-center aspect-square">
            <img src={logoWhite} alt="Bellex logo" className="w-full max-w-[160px]" />
          </div>
          <span className="text-xs text-muted-foreground">Fundo salmon</span>
        </div>
      </div>

      {/* BrandGrain — padrão de fundo */}
      <h3 className="font-heading text-xl font-light mb-4 mt-10">Fundo Grain — Padrão da Marca</h3>
      <p className="text-sm text-muted-foreground mb-6">
        O grain salmão é o fundo canônico da marca. Use <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">&lt;BrandGrain /&gt;</code> em qualquer seção que precise desse visual.
        O preset vive em <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">src/lib/brand.ts → BRAND_GRAIN_PROPS</code>.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Preview sem overlay */}
        <div className="flex flex-col gap-3">
          <div className="relative h-40 rounded-2xl overflow-hidden">
            <BrandGrain />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono">&lt;BrandGrain /&gt;</code> — sem overlay
          </div>
        </div>
        {/* Preview com overlay (para texto branco) */}
        <div className="flex flex-col gap-3">
          <div className="relative h-40 rounded-2xl overflow-hidden flex items-center justify-center">
            <BrandGrain overlay />
            <img src={logoWhite} alt="Bellex logo" className="relative z-10 w-32" />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono">&lt;BrandGrain overlay /&gt;</code> — com texto branco
          </div>
        </div>
      </div>
      {/* Cores */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-2 mb-10 text-xs font-mono">
        <p className="text-muted-foreground font-sans text-xs mb-3 font-medium uppercase tracking-wide">Paleta do grain</p>
        {Object.entries(BRAND_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full border border-border shrink-0" style={{ background: val }} />
            <span className="text-foreground">BRAND_COLORS.{key}</span>
            <span className="text-muted-foreground ml-auto">{val}</span>
          </div>
        ))}
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

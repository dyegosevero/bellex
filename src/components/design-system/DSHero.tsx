import logoColor from "@/assets/logo-color.png";

export const DSHero = () => {
  return (
    <section className="relative overflow-hidden gradient-warm">
      <div className="max-w-7xl mx-auto px-8 py-24 flex flex-col items-center text-center">
        <div className="mb-8">
          <img src={logoColor} alt="Bellex" className="h-12 w-auto" />
        </div>
        <h1 className="font-heading text-5xl md:text-6xl font-light tracking-tight text-foreground mb-4">
          Design System
        </h1>
        <p className="text-muted-foreground text-lg font-normal max-w-xl leading-relaxed">
          Documentação oficial do sistema de design Bellex.
          Salmon, Manrope e bordas arredondadas — gestão de clínicas com identidade.
        </p>
        <div className="ds-divider mx-auto mt-8" />
        <p className="text-xs text-muted-foreground tracking-widest uppercase mt-4">Versão 1.0 · Junho 2026</p>
      </div>
    </section>
  );
};

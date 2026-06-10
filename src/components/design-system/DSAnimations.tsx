import { useState } from "react";
import { LogoDraw } from "@/components/ui/logo-draw";
import { SlidingTabsList } from "@/components/ui/sliding-tabs-list";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export const DSAnimations = () => {
  const [drawKey, setDrawKey] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(false);

  const animations = [
    { name: "fade-in", duration: "300ms", easing: "ease-out", usage: "Entrada de elementos, cards, conteúdo", css: "animate-fade-in" },
    { name: "fade-in-slow", duration: "800ms", easing: "ease-out", usage: "Hero sections, imagens de destaque", css: "animate-fade-in-slow" },
    { name: "slide-up", duration: "600ms", easing: "ease-out", usage: "Listas, itens sequenciais", css: "animate-slide-up" },
    { name: "scale-in", duration: "200ms", easing: "ease-out", usage: "Modais, tooltips, popovers", css: "animate-scale-in" },
    { name: "shimmer", duration: "2000ms", easing: "linear (infinite)", usage: "Skeleton loading states", css: "animate-shimmer" },
  ];

  return (
    <section className="ds-section border-t border-border">
      <span className="text-xs text-primary tracking-widest uppercase font-medium">06</span>
      <h2 className="ds-section-title mt-2">Sistema de Animações</h2>
      <p className="ds-section-subtitle">Transições suaves e discretas que reforçam a experiência premium.</p>

      {/* Logo Draw Animation Showcase */}
      <h3 className="font-heading text-lg font-medium mb-4">Logo Draw Animation</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Efeito <strong>Stroke → Fill</strong>: o logo Bellex é desenhado com traço (draw) e depois preenchido com fade. 
        Ideal para telas de carregamento e splashscreens.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* Default */}
        <div className="ds-card flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Padrão</p>
          <div className="flex items-center justify-center h-40">
            <LogoDraw key={`default-${drawKey}`} size={60} />
          </div>
          <code className="ds-code text-[10px]">{'<LogoDraw size={60} />'}</code>
        </div>

        {/* Loop */}
        <div className="ds-card flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Loop (Loader)</p>
          <div className="flex items-center justify-center h-40">
            <LogoDraw key={`loop-${drawKey}`} size={48} loop />
          </div>
          <code className="ds-code text-[10px]">{'<LogoDraw size={48} loop />'}</code>
        </div>

        {/* Slow & Large */}
        <div className="ds-card flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Lento + Grande</p>
          <div className="flex items-center justify-center h-40">
            <LogoDraw key={`slow-${drawKey}`} size={80} drawDuration={2800} fillDuration={1000} fillDelay={400} />
          </div>
          <code className="ds-code text-[10px]">{'drawDuration={2800}'}</code>
        </div>
      </div>

      {/* Replay button */}
      <div className="flex items-center gap-3 mb-10">
        <Button variant="outline" size="sm" onClick={() => setDrawKey((k) => k + 1)}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Replay animação
        </Button>
        <span className="text-xs text-muted-foreground">Clique para reiniciar todas as demonstrações acima</span>
      </div>

      {/* Props table */}
      <div className="ds-card mb-10">
        <h4 className="text-sm font-medium mb-3">Props</h4>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prop</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Default</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Descrição</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                ["size", "number", "80", "Largura em px (altura proporcional)"],
                ["drawDuration", "number", "1800", "Duração do stroke draw (ms)"],
                ["fillDuration", "number", "600", "Duração do fill fade-in (ms)"],
                ["fillDelay", "number", "200", "Delay entre draw e fill (ms)"],
                ["loop", "boolean", "false", "Repetir infinitamente (loader)"],
                ["strokeColor", "string", "hsl(var(--primary))", "Cor do traço"],
                ["fillColor", "string", "hsl(var(--primary))", "Cor do preenchimento"],
              ].map(([prop, type, def, desc], i) => (
                <tr key={prop} className={`border-t border-border ${i % 2 ? "bg-muted/20" : ""}`}>
                  <td className="p-3 font-mono font-medium">{prop}</td>
                  <td className="p-3 text-muted-foreground font-mono">{type}</td>
                  <td className="p-3 text-muted-foreground font-mono">{def}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ds-divider" />

      {/* Rules */}
      <div className="ds-card mb-8">
        <h3 className="font-heading text-lg font-medium mb-4">Princípios</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "Sutileza", desc: "Animações devem ser sentidas, não vistas. Nenhuma animação deve distrair do conteúdo." },
            { title: "Propósito", desc: "Cada animação comunica algo: entrada, saída, estado, hierarquia. Sem animação decorativa." },
            { title: "Performance", desc: "Usar transform e opacity apenas. Evitar animações em layout properties (width, height, top)." },
            { title: "Consistência", desc: "Mesma duração e easing para elementos do mesmo tipo em toda a aplicação." },
          ].map((p) => (
            <div key={p.title} className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Animation catalog */}
      <h3 className="font-heading text-lg font-medium mb-4">Catálogo de Animações</h3>
      <div className="border border-border rounded-lg overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Duração</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Easing</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Classe CSS</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Uso</th>
            </tr>
          </thead>
          <tbody>
            {animations.map((a, i) => (
              <tr key={a.name} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                <td className="p-4 text-sm font-medium">{a.name}</td>
                <td className="p-4 text-sm text-muted-foreground font-mono text-xs">{a.duration}</td>
                <td className="p-4 text-sm text-muted-foreground">{a.easing}</td>
                <td className="p-4"><code className="ds-code">{a.css}</code></td>
                <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{a.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover Effects */}
      <h3 className="font-heading text-lg font-medium mb-4">Hover Effects</h3>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="ds-card cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md text-center">
          <p className="text-sm">Scale + Shadow</p>
          <p className="text-xs text-muted-foreground mt-1">Cards interativos</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card cursor-pointer transition-all duration-200 hover:border-primary/40 text-center">
          <p className="text-sm">Border Color</p>
          <p className="text-xs text-muted-foreground mt-1">Itens de lista</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card cursor-pointer transition-all duration-200 hover:bg-muted/50 text-center">
          <p className="text-sm">Background</p>
          <p className="text-xs text-muted-foreground mt-1">Linhas de tabela</p>
        </div>
      </div>

      {/* Tabs sliding */}
      <h3 className="font-heading text-lg font-medium mb-4 mt-8">Tabs Sliding Pill</h3>
      <p className="text-sm text-muted-foreground mb-5">
        Pill deslizante entre abas — <code className="ds-code">SlidingTabsList</code>.
        MutationObserver detecta <code className="ds-code">data-state="active"</code> do Radix e move o pill com CSS transition.
        <code className="ds-code text-[10px] ml-2">prefers-reduced-motion</code> desativa automaticamente.
      </p>
      <div className="ds-card mb-8 flex flex-col items-start gap-4">
        <Tabs defaultValue="dados" className="w-full">
          <SlidingTabsList>
            {(["dados", "agenda", "financeiro", "relatorios"] as const).map((val, idx) => (
              <TabsTrigger key={val} value={val} className="t-tab">
                {["Dados", "Agenda", "Financeiro", "Relatórios"][idx]}
              </TabsTrigger>
            ))}
          </SlidingTabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">Clique nas abas para ver o pill deslizar ↑</p>
      </div>

      {/* Skeleton */}
      <h3 className="font-heading text-lg font-medium mb-4">Skeleton Loading</h3>
      <div className="ds-card">
        <div className="space-y-3">
          <div className="h-4 w-3/4 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
          <div className="h-4 w-1/2 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
          <div className="h-4 w-5/6 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
          <div className="h-20 w-full rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
        </div>
        <p className="text-xs text-muted-foreground mt-4">Gradiente shimmer com duração de 2s, linear, infinito. Cores: muted → muted/50 → muted.</p>
      </div>
    </section>
  );
};

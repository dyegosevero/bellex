import { Check, Globe, Users, BarChart3 } from "lucide-react";

const items = [
  { icon: Check, label: "Conforme LGPD", sub: "Dados protegidos por lei" },
  { icon: Globe, label: "99,9% de uptime", sub: "Disponível quando você precisar" },
  { icon: Users, label: "Suporte humano", sub: "Seg a sab, 8h–20h" },
  { icon: BarChart3, label: "Setup em 30 min", sub: "Equipe ajuda gratuitamente" },
];

export function LandingTrust() {
  return (
    <section className="py-14 bg-background border-y border-border/60">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

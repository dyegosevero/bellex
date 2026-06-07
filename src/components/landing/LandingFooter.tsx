import { Link } from "react-router-dom";
import logoColor from "@/assets/logo-color.png";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <img src={logoColor} alt="Bellex" className="h-7 w-auto mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Sistema completo de gestão para clínicas de estética. Tudo que você precisa em um único lugar.
            </p>
          </div>

          {/* Recursos */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Recursos</p>
            <ul className="space-y-2.5">
              {[
                { label: "Agenda", href: "/recursos/agenda" },
                { label: "Clientes", href: "/recursos/clientes" },
                { label: "Financeiro", href: "/recursos/financeiro" },
                { label: "Marketing", href: "/recursos/marketing" },
                { label: "Relatórios", href: "/recursos/relatorios" },
                { label: "Agendamento Online", href: "/recursos/agendamento-online" },
              ].map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Produto */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Produto</p>
            <ul className="space-y-2.5">
              {[
                { label: "Preços", href: "#precos" },
                { label: "Segurança", href: "#" },
                { label: "Integrações", href: "#" },
                { label: "API", href: "#" },
                { label: "Changelog", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Empresa</p>
            <ul className="space-y-2.5">
              {[
                { label: "Sobre", href: "#sobre" },
                { label: "Blog", href: "#" },
                { label: "Termos", href: "#" },
                { label: "Privacidade", href: "#" },
                { label: "Contato", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Bellex. Todos os direitos reservados.</p>
          <p className="text-xs text-muted-foreground">Feito com ♥ para clínicas de estética</p>
        </div>
      </div>
    </footer>
  );
}

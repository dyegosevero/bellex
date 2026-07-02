import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDemoModal } from "./DemoModalContext";
import logoColor from "@/assets/logo-color.png";
import {
  Calendar, Users, CreditCard, Megaphone, BarChart3, Globe,
} from "lucide-react";

const recursos = [
  {
    label: "Agenda Inteligente",
    desc: "Calendário visual, lembretes e bloqueios automáticos",
    href: "/recursos/agenda",
    icon: Calendar,
  },
  {
    label: "Gestão de Clientes",
    desc: "Prontuário digital, fotos antes/depois, anamnese",
    href: "/recursos/clientes",
    icon: Users,
  },
  {
    label: "Cobranças & Faturamento",
    desc: "Controle de receita, inadimplência e relatórios",
    href: "/recursos/financeiro",
    icon: CreditCard,
  },
  {
    label: "Marketing Automatizado",
    desc: "E-mail, SMS e reativação de clientes inativos",
    href: "/recursos/marketing",
    icon: Megaphone,
  },
  {
    label: "Relatórios & Métricas",
    desc: "Dados reais por especialista, serviço e período",
    href: "/recursos/relatorios",
    icon: BarChart3,
  },
  {
    label: "Agendamento Online",
    desc: "Link público 24h — clientes agendam sem ligar",
    href: "/recursos/agendamento-online",
    icon: Globe,
  },
];

export function LandingNav() {
  const { openDemo } = useDemoModal();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaTimer = useRef<ReturnType<typeof setTimeout>>();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [location]);

  const openMega = () => {
    clearTimeout(megaTimer.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    megaTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/96 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img src={logoColor} alt="Bellex" className="h-6 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Recursos mega menu trigger */}
          <div
            className="relative"
            onMouseEnter={openMega}
            onMouseLeave={closeMega}
          >
            <button className={`px-4 py-2 text-sm transition-colors flex items-center gap-1 ${megaOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Recursos
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className={`transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Mega menu panel */}
            {megaOpen && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[580px] bg-background border border-border rounded-2xl shadow-xl overflow-hidden"
                onMouseEnter={openMega}
                onMouseLeave={closeMega}
              >
                <div className="p-5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-4">
                    Funcionalidades
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {recursos.map((r) => (
                      <Link
                        key={r.href}
                        to={r.href}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/60 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                          <r.icon size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground leading-tight">{r.label}</p>
                          <p className="text-xs text-muted-foreground leading-snug mt-0.5">{r.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={openDemo}
                      className="block w-full text-center text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors px-4 py-2.5 rounded-xl"
                    >
                      Agendar Demo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {[
            { label: "Como funciona", id: "como-funciona" },
            { label: "Depoimentos", id: "depoimentos" },
            { label: "Preços", id: "precos" },
            { label: "FAQ", id: "faq" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={openDemo}
            className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Agendar Demo
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {mobileOpen
              ? <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              : <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 py-5 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3">Recursos</p>
          {recursos.map((r) => (
            <Link
              key={r.href}
              to={r.href}
              className="flex items-center gap-3 py-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <r.icon size={14} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{r.label}</span>
            </Link>
          ))}
          <div className="border-t border-border pt-4 mt-4 space-y-1">
            {[
              { label: "Como funciona", id: "como-funciona" },
              { label: "Depoimentos", id: "depoimentos" },
              { label: "Preços", id: "precos" },
              { label: "FAQ", id: "faq" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }); setMobileOpen(false); }}
                className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
            <button onClick={openDemo} className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-xl text-center">
              Agendar Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

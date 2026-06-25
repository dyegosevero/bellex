import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Plug, DollarSign, HardDrive,
  Bot, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import logoWhite from "@/assets/logo-1x1-white.png";
import { BrandGrain } from "@/components/BrandGrain";

const NAV = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard",    end: true },
  { to: "/clientes",      icon: Users,           label: "Clientes" },
  { to: "/integracoes",   icon: Plug,            label: "Integrações" },
  { to: "/financeiro",    icon: DollarSign,      label: "Financeiro" },
  { to: "/storage",       icon: HardDrive,       label: "Storage" },
  { to: "/ia",            icon: Bot,             label: "IA & Uso" },
  { to: "/configuracoes", icon: Settings,        label: "Configurações" },
];

const SIDEBAR_KEY = "bellex_sa_sidebar";

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) !== "false"; } catch { return true; }
  });

  const toggle = () => setExpanded(v => {
    const next = !v;
    try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
    return next;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col shrink-0 border-r border-border/60 bg-card transition-all duration-200",
        expanded ? "w-56" : "w-[52px]"
      )}>
        {/* Logo */}
        <div className={cn(
          "relative h-14 flex items-center overflow-hidden shrink-0",
          expanded ? "px-4" : "justify-center"
        )}>
          <BrandGrain />
          {expanded ? (
            <div className="relative z-10 flex items-center gap-2 min-w-0">
              <img src={logoWhite} alt="Bellex" className="h-5 shrink-0" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest whitespace-nowrap">
                Super Admin
              </span>
            </div>
          ) : (
            <div className="relative z-10 w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                "flex items-center gap-2.5 h-9 rounded-lg px-2.5 text-sm transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                isActive && "bg-primary/10 text-primary font-medium",
                !expanded && "justify-center px-0"
              )}
              title={!expanded ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {expanded && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border/40 space-y-0.5">
          <button
            onClick={toggle}
            className="flex items-center gap-2.5 h-9 w-full rounded-lg px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title={expanded ? "Recolher" : "Expandir"}
          >
            {expanded
              ? <><PanelLeftClose className="w-4 h-4 shrink-0" /><span className="text-xs">Recolher</span></>
              : <PanelLeftOpen className="w-4 h-4 shrink-0" />}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-2.5 h-9 w-full rounded-lg px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
              !expanded && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {expanded && <span className="text-xs">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

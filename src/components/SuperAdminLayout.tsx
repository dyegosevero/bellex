import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, CreditCard, DollarSign, BarChart3,
  Plug, Settings, LogOut, ChevronDown,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoWhite from "@/assets/logo-1x1-white.png";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard",   end: true },
  { to: "/workspaces",    icon: Users,           label: "Workspaces" },
  { to: "/planos-ws",     icon: CreditCard,      label: "Planos WS" },
  { to: "/financeiro",    icon: DollarSign,      label: "Financeiro" },
  { to: "/uso-ia",        icon: BarChart3,       label: "Uso & IA" },
  { to: "/integracoes",   icon: Plug,            label: "Integrações" },
  { to: "/configuracoes", icon: Settings,        label: "Config" },
];

const SIDEBAR_KEY = "bellex_sa_sidebar";

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) !== "false"; } catch { return true; }
  });

  const toggle = () => {
    setExpanded(v => {
      const next = !v;
      try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
      return next;
    });
  };

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
          "h-14 flex items-center shrink-0 bg-[#c97b63]",
          expanded ? "px-4 gap-2" : "justify-center"
        )}>
          {expanded ? (
            <>
              <img src={logoWhite} alt="Bellex" className="h-5" />
              <span className="text-[10px] font-semibold text-white/80 uppercase tracking-widest">Super Admin</span>
            </>
          ) : (
            <img src={logoWhite} alt="B" className="h-5" />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={!expanded ? label : undefined}
              className={({ isActive }) => cn(
                "flex items-center h-9 rounded-lg transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/50",
                expanded ? "px-2.5 gap-2.5" : "justify-center",
                isActive && "bg-primary/10 text-primary font-medium hover:bg-primary/15"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {expanded && <span className="text-[13px] truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-3 space-y-0.5 border-t border-border/40 pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center h-9 w-full rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50",
                expanded ? "px-2.5 gap-2.5" : "justify-center"
              )}>
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary">SA</AvatarFallback>
                </Avatar>
                {expanded && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">Super Admin</p>
                    </div>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={toggle}
            title={expanded ? "Recolher menu" : "Expandir menu"}
            className="flex items-center h-9 w-full rounded-lg px-2.5 gap-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            {expanded
              ? <><PanelLeftClose className="w-4 h-4 shrink-0" /><span className="text-[13px]">Recolher</span></>
              : <PanelLeftOpen className="w-4 h-4 shrink-0" />
            }
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

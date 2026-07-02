import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, CreditCard, DollarSign,
  UserCog, BarChart3, Bell, Settings, LogOut,
  PanelLeftClose, PanelLeftOpen, ChevronDown, LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo-color.png";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/dashboard",      icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clientes",       icon: Users,           label: "Clientes" },
  { to: "/clinicas",       icon: Building2,       label: "Clínicas" },
  { to: "/planos",         icon: CreditCard,      label: "Planos" },
  { to: "/financeiro",     icon: DollarSign,      label: "Financeiro" },
  { to: "/usuarios",       icon: UserCog,         label: "Usuários" },
  { to: "/relatorios",     icon: BarChart3,       label: "Relatórios" },
  { to: "/configuracoes",  icon: Settings,        label: "Configurações" },
  // { to: "/notificacoes",   icon: Bell,            label: "Notificações", badge: 3 },
  // { to: "/suporte",        icon: LifeBuoy,        label: "Suporte", badge: 2 },
];

const SIDEBAR_KEY = "bellex_workspace_sidebar";

export default function WorkspaceLayout() {
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col shrink-0 border-r border-border/60 bg-card transition-all duration-200",
          expanded ? "w-56" : "w-[52px]"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "h-14 flex items-center shrink-0",
          expanded ? "px-4" : "justify-center"
        )}>
          <img src={logo} alt="Bellex" className="h-5" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              title={!expanded ? label : undefined}
              className={({ isActive }) => cn(
                "flex items-center h-9 rounded-lg transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/50",
                expanded ? "px-2.5 gap-2.5" : "justify-center",
                isActive && "bg-primary/10 text-primary font-medium hover:bg-primary/15"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {expanded && (
                <span className="text-[13px] flex-1 truncate">{label}</span>
              )}
              {expanded && badge ? (
                <Badge className="h-4 min-w-4 px-1 text-[10px] bg-primary text-white">{badge}</Badge>
              ) : !expanded && badge ? (
                <span className="absolute ml-4 -mt-4 w-2 h-2 rounded-full bg-primary" />
              ) : null}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-3 space-y-0.5 border-t border-border/40 pt-2">
          <NavLink
            to="/configuracoes"
            title={!expanded ? "Configurações" : undefined}
            className={({ isActive }) => cn(
              "flex items-center h-9 rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50",
              expanded ? "px-2.5 gap-2.5" : "justify-center",
              isActive && "bg-primary/10 text-primary"
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {expanded && <span className="text-[13px]">Configurações</span>}
          </NavLink>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center h-9 w-full rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50",
                expanded ? "px-2.5 gap-2.5" : "justify-center"
              )}>
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary">WS</AvatarFallback>
                </Avatar>
                {expanded && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">Workspace Admin</p>
                      <p className="text-[10px] text-muted-foreground truncate">owner</p>
                    </div>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/perfil")}>
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => navigate("/login")}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
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

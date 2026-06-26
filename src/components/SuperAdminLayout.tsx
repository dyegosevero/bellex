import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, CreditCard, DollarSign, BarChart3,
  Plug, Settings, LogOut, Shield, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import logoWhite from "@/assets/logo-1x1-white.png";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard",   end: true },
  { to: "/workspaces",    icon: Users,           label: "Workspaces" },
  { to: "/planos-ws",     icon: CreditCard,      label: "Planos WS" },
  { to: "/financeiro",    icon: DollarSign,      label: "Financeiro" },
  { to: "/uso-ia",        icon: BarChart3,       label: "Uso & IA" },
  { to: "/integracoes",   icon: Plug,            label: "Integrações" },
  { to: "/configuracoes", icon: Settings,        label: "Config" },
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen bg-[#08080f] overflow-hidden">
      {/* Topbar */}
      <header className="h-12 flex items-center shrink-0 border-b border-white/[0.06] bg-[#0d0d1a] px-4 gap-0">
        {/* Logo + badge */}
        <div className="flex items-center gap-2.5 mr-6">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#e8957a] to-[#c96a4a] flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <img src={logoWhite} alt="Bellex" className="h-4 opacity-90" />
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.12em] border border-white/10 px-1.5 py-0.5 rounded">
            Super Admin
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex items-center gap-0.5 flex-1">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                "flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] transition-colors whitespace-nowrap",
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/60 border border-blue-900/60 px-2 py-1 rounded-md tracking-wide">
            PROD
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 h-8 px-2 rounded-md text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-colors">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#e8957a] to-[#a855f7] flex items-center justify-center text-[10px] font-bold text-white">
                  D
                </div>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-[#0d0d1a] border-white/10">
              <DropdownMenuItem className="text-white/70 hover:text-white focus:text-white focus:bg-white/10" onClick={() => navigate("/configuracoes")}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-950/40" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#08080f]">
        <Outlet />
      </main>
    </div>
  );
}

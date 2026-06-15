import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logo1x1 from "@/assets/logo-1x1.png";
import logoColor from "@/assets/logo-color.png";
import ShareBookingDialog from "@/components/ShareBookingDialog";
import { ActiveSessionBar } from "@/components/ActiveSessionBar";
import { PendingBillingsAlert } from "@/components/PendingBillingsAlert";
import {
  Calendar, Users, Package, CreditCard,
  DollarSign, BarChart3, Settings, LogOut, Menu, X,
  Sparkles, ExternalLink, Share2, Link, Megaphone,
  ChevronRight, ChevronDown, PanelLeftClose, PanelLeftOpen, UserCog,
  LayoutDashboard, Kanban, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "motion/react";
import { PageTransition } from "@/components/PageTransition";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/resumo",      icon: LayoutDashboard,  label: "Dashboard" },
  { to: "/dashboard",   icon: Calendar,         label: "Agenda" },
  { to: "/clientes",    icon: Users,            label: "Clientes" },
  { to: "/cobrancas",   icon: CreditCard,       label: "Cobranças" },
  { to: "/faturamento", icon: DollarSign,       label: "Faturamento" },
  { to: "/produtos",    icon: Package,          label: "Produtos" },
  { to: "/servicos",    icon: Sparkles,         label: "Serviços",     roles: ["admin", "atendimento"] },
  { to: "/equipe",      icon: UserCog,          label: "Equipe",       adminOnly: true },
  { to: "/marketing",   icon: Megaphone,        label: "Marketing",    adminOnly: true },
  { to: "/pipeline",    icon: Kanban,           label: "Pipeline" },
  { to: "/mensagens",   icon: MessageCircle,    label: "Mensagens" },
  { to: "/relatorios",  icon: BarChart3,        label: "Relatórios" },
  { to: "/admin",       icon: Settings,         label: "Configurações" },
];

const SIDEBAR_KEY = "bellex_sidebar_open";

function SidebarBtn({ icon, label, expanded, onClick, title, end }: { icon: React.ReactNode; label: string; expanded: boolean; onClick?: () => void; title?: string; end?: React.ReactNode }) {
  return (
    <button
      title={!expanded ? (title || label) : undefined}
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", width: "100%", height: 36, gap: expanded ? 10 : 0, padding: expanded ? "0 10px" : "0", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", justifyContent: expanded ? "flex-start" : "center", outline: "none", color: "hsl(var(--muted-foreground))", transition: "background .15s, color .15s", flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = "hsl(var(--muted) / 0.5)"; e.currentTarget.style.color = "hsl(var(--foreground))"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
      {expanded && <span style={{ fontSize: 13, flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden" }}>{label}</span>}
      {expanded && end}
    </button>
  );
}

const AppLayout = () => {
  const { signOut, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === "true"; } catch { return false; }
  });
  const [hovered, setHovered] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileName(data.full_name || null);
          setProfileAvatar(data.avatar_url || null);
        }
      });
  }, [user]);

  function toggleSidebar() {
    const next = !expanded;
    setExpanded(next);
    try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
  }

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const filteredNav = navItems.filter((item) => {
    if (item.to === "/admin" && role !== "admin") return false;
    if ((item as any).roles) return (item as any).roles.includes(role);
    if ((item as any).adminOnly && role !== "admin") return false;
    if (item.to === "/relatorios" && (role === "atendimento" || role === "especialista")) return false;
    if (item.to === "/faturamento" && (role === "atendimento" || role === "especialista")) return false;
    if (item.to === "/cobrancas" && (role === "atendimento" || role === "especialista")) return false;
    return true;
  });

  return (
    <div className="h-screen overflow-hidden flex bg-background font-body">

      {/* ── SIDEBAR (desktop) ──────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: !expanded && hovered ? 50 : 40,
          overflow: "hidden",
          width: expanded || hovered ? 208 : 52,
          transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
          background: "hsl(30 22% 97%)",
          flexShrink: 0,
          boxShadow: !expanded && hovered ? "4px 0 24px hsl(var(--foreground) / 0.08)" : "none",
        }}
        onMouseEnter={() => { if (!expanded) setHovered(true); }}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Header: logo only */}
        <div className="flex items-center h-14 px-3 flex-shrink-0 gap-2">
          {/* Compact icon — fades out when expanded or hovered */}
          <img
            src={logo1x1}
            alt="Bellex"
            className={cn(
              "w-7 h-7 object-contain flex-shrink-0 cursor-pointer absolute transition-all duration-200",
              expanded || hovered ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100"
            )}
            onClick={() => navigate("/dashboard")}
          />
          {/* Full logo — fades in when expanded or hovered */}
          <img
            src={logoColor}
            alt="Bellex"
            className={cn(
              "h-6 w-auto object-contain flex-shrink-0 cursor-pointer transition-all duration-200",
              expanded || hovered ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => navigate("/dashboard")}
          />
        </div>

        {/* Nav — always render label, animate width/opacity */}
        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2 flex flex-col gap-0.5 px-2">
          {filteredNav.map((item) => {
            const show = expanded || hovered;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={!show ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center h-9 rounded-lg transition-colors overflow-hidden whitespace-nowrap",
                    show ? "px-2.5 gap-2.5" : "px-0 justify-center gap-0",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={15} className="flex-shrink-0" />
                    <span
                      className={cn(
                        "text-[13px] transition-all duration-200 overflow-hidden",
                        show ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
                      )}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, borderTop: "1px solid hsl(var(--border) / 0.4)", padding: "8px 8px 12px" }}>
          {(() => {
            const show = expanded || hovered;
            return (
              <>
          {/* Agendamento accordion */}
          <SidebarBtn icon={<Link size={15} />} label="Agendamento" expanded={show} title="Agendamento online"
            onClick={() => { if (show) setBookingOpen(o => !o); else { toggleSidebar(); setTimeout(() => setBookingOpen(true), 220); } }}
            end={show ? <ChevronDown size={13} style={{ transform: bookingOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} /> : undefined}
          />
          {show && bookingOpen && (
            <div style={{ paddingLeft: 28 }}>
              <SidebarBtn icon={<Share2 size={13} />} label="Compartilhar" expanded={true} onClick={() => setShareOpen(true)} />
              <SidebarBtn icon={<ExternalLink size={13} />} label="Editar página" expanded={true} onClick={() => window.open("/agendamento", "_blank")} />
            </div>
          )}

          {/* Toggle */}
          <SidebarBtn
            icon={expanded ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            label="Recolher menu" expanded={show} title={expanded ? "Recolher" : "Expandir"}
            onClick={toggleSidebar}
          />

          {/* Profile */}
          <div style={{ borderTop: "1px solid hsl(var(--border) / 0.3)", marginTop: 6, paddingTop: 6 }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title={!show ? (profileName || user?.email || "") : undefined}
                  style={{ display: "flex", alignItems: "center", width: "100%", gap: 10, padding: show ? "6px 10px" : "6px 0", borderRadius: 10, background: "transparent", border: "none", cursor: "pointer", justifyContent: show ? "flex-start" : "center", outline: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "hsl(var(--muted) / 0.5)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Avatar — explicit size via style, never clipped */}
                  <span style={{ width: 32, height: 32, borderRadius: "50%", background: "hsl(var(--primary) / 0.15)", border: "2px solid hsl(var(--primary) / 0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: "hsl(var(--primary))", overflow: "hidden" }}>
                    {profileAvatar
                      ? <img src={profileAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : getInitials(profileName || user?.email || "U")
                    }
                  </span>
                  {show && (
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profileName || "Minha conta"}</span>
                      <span style={{ display: "block", fontSize: 10, color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</span>
                    </span>
                  )}
                  {show && <ChevronRight size={11} style={{ flexShrink: 0, color: "hsl(var(--muted-foreground))", opacity: 0.6 }} />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <div className="px-3 py-2">
                  {profileName && <p className="text-sm font-medium truncate">{profileName}</p>}
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  {role && <span className="inline-block text-[10px] uppercase tracking-wider bg-accent text-accent-foreground px-2 py-0.5 rounded mt-1">{role}</span>}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/perfil")}>Perfil</DropdownMenuItem>
                {role === "admin" && <DropdownMenuItem onClick={() => navigate("/docs")}>Documentação</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive"><LogOut className="w-4 h-4 mr-2" />Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
              </>
            );
          })()}
        </div>
      </aside>

      {/* ── MOBILE TOPBAR ──────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 flex items-center px-4 bg-background/90 backdrop-blur-md border-b border-border/30">
        <img
          src={logo1x1}
          alt="Bellex"
          className="w-7 h-7 object-contain cursor-pointer"
          onClick={() => navigate("/dashboard")}
        />
        <button
          className="ml-auto p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/25"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute inset-y-0 left-0 w-60 flex flex-col"
            style={{ background: "hsl(30 22% 97%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 flex items-center px-4">
              <img src={logoColor} alt="Bellex" className="h-6 w-auto object-contain" />
            </div>
            <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
              {filteredNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )
                  }
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="flex-shrink-0 p-3">
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/8 rounded-lg w-full transition-colors"
              >
                <LogOut size={14} /><span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ───────────────────────────────────────────── */}
      {/* Mobile: full width below topbar. Desktop: offset by sidebar width */}
      <div
        className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0"
        style={{ marginLeft: expanded ? 208 : 52, transition: "margin-left 0.2s cubic-bezier(0.4,0,0.2,1)" }}
      >
        <ActiveSessionBar />
        <PendingBillingsAlert />
        <main className={cn(
          "flex-1 min-w-0 min-h-0",
          ["/pipeline", "/mensagens"].includes(location.pathname)
            ? "overflow-hidden flex flex-col"
            : "overflow-auto p-6 lg:p-8 w-full"
        )}>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      <ShareBookingDialog open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
};

export default AppLayout;

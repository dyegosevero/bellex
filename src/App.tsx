import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import { LogoDraw } from "@/components/ui/logo-draw";
import { loadBrandForDomain, useBrand, type BrandConfig } from "@/hooks/useBrand";

// ─── Hostname detection ────────────────────────────────────────────────────────
import {
  isSuperAdminDomain,
  isWorkspaceDomain,
  isBookingDomain,
  isLandingDomain,
  isClinicSubdomain,
  isCustomDomain,
} from "@/lib/domain";

export {
  isSuperAdminDomain,
  isWorkspaceDomain,
  isBookingDomain,
  isLandingDomain,
  isClinicSubdomain,
  isCustomDomain,
} from "@/lib/domain";

// ─── Lazy pages — SuperAdmin ───────────────────────────────────────────────────
const SuperAdminLayout     = lazy(() => import("@/components/SuperAdminLayout"));
const SaDashboard          = lazy(() => import("@/pages/superadmin/SaDashboard"));
const SaWorkspaces         = lazy(() => import("@/pages/superadmin/SaWorkspaces"));
const SaPlanosWS           = lazy(() => import("@/pages/superadmin/SaPlanosWS"));
const SaIntegracoes        = lazy(() => import("@/pages/superadmin/SaIntegracoes"));
const SaFinanceiro         = lazy(() => import("@/pages/superadmin/SaFinanceiro"));
const SaUsoIA              = lazy(() => import("@/pages/superadmin/SaUsoIA"));
const SaConfiguracoes      = lazy(() => import("@/pages/superadmin/SaConfiguracoes"));

// ─── Lazy pages — Workspace ────────────────────────────────────────────────────
const WorkspaceLayout      = lazy(() => import("@/components/WorkspaceLayout"));
const WorkspaceDashboard   = lazy(() => import("@/pages/workspace/WorkspaceDashboard"));
const WorkspaceClientes    = lazy(() => import("@/pages/workspace/WorkspaceClientes"));
const WorkspaceClinics     = lazy(() => import("@/pages/workspace/WorkspaceClinics"));
const WorkspaceClinicDetail= lazy(() => import("@/pages/workspace/WorkspaceClinicDetail"));
const WorkspaceClinicNew   = lazy(() => import("@/pages/workspace/WorkspaceClinicNew"));
const WorkspacePlanos      = lazy(() => import("@/pages/workspace/WorkspacePlanos"));
const WorkspacePlanEdit    = lazy(() => import("@/pages/workspace/WorkspacePlanEdit"));
const WorkspaceFinanceiro  = lazy(() => import("@/pages/workspace/WorkspaceFinanceiro"));
const WorkspaceUsuarios    = lazy(() => import("@/pages/workspace/WorkspaceUsuarios"));
const WorkspaceRelatorios  = lazy(() => import("@/pages/workspace/WorkspaceRelatorios"));
const WorkspaceNotificacoes= lazy(() => import("@/pages/workspace/WorkspaceNotificacoes"));
const WorkspaceConfiguracoes= lazy(() => import("@/pages/workspace/WorkspaceConfiguracoes"));
const WorkspaceSuporte     = lazy(() => import("@/pages/workspace/WorkspaceSuporte"));

// ─── Lazy pages — Clinic ──────────────────────────────────────────────────────
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
const Dashboard            = lazy(() => import("@/pages/Dashboard"));
const DashboardHome        = lazy(() => import("@/pages/DashboardHome"));
const Documents            = lazy(() => import("@/pages/Documents"));
const DocumentEdit         = lazy(() => import("@/pages/DocumentEdit"));
const Clients              = lazy(() => import("@/pages/Clients"));
const ClientDetail         = lazy(() => import("@/pages/ClientDetail"));
const ClientNew            = lazy(() => import("@/pages/ClientNew"));
const ClientEdit           = lazy(() => import("@/pages/ClientEdit"));
const AppointmentNew       = lazy(() => import("@/pages/AppointmentNew"));
const AppointmentDetail    = lazy(() => import("@/pages/AppointmentDetail"));
const AppointmentSession   = lazy(() => import("@/pages/AppointmentSession"));
const Products             = lazy(() => import("@/pages/Products"));
const ProductNew           = lazy(() => import("@/pages/ProductNew"));
const ProductEdit          = lazy(() => import("@/pages/ProductEdit"));
const ProductDetail        = lazy(() => import("@/pages/ProductDetail"));
const CaixaFinanceiro      = lazy(() => import("@/pages/CaixaFinanceiro"));
const Charges              = lazy(() => import("@/pages/Charges"));
const Faturamento          = lazy(() => import("@/pages/Faturamento"));
const ChargeNew            = lazy(() => import("@/pages/ChargeNew"));
const ChargeDetail         = lazy(() => import("@/pages/ChargeDetail"));
const ChargeEdit           = lazy(() => import("@/pages/ChargeEdit"));
const InactiveClients      = lazy(() => import("@/pages/InactiveClients"));
const Reports              = lazy(() => import("@/pages/Reports"));
const Admin                = lazy(() => import("@/pages/Admin"));
const AdminAgenda          = lazy(() => import("@/pages/admin/AdminAgenda"));
const AdminEmail           = lazy(() => import("@/pages/admin/AdminEmail"));
const AdminNotificacoes    = lazy(() => import("@/pages/admin/AdminNotificacoes"));
const AdminIntegracoes     = lazy(() => import("@/pages/admin/AdminIntegracoes"));
const AdminDocumentos      = lazy(() => import("@/pages/admin/AdminDocumentos"));
const AdminAgentes         = lazy(() => import("@/pages/admin/AdminAgentes"));
const AdminWhatsApp        = lazy(() => import("@/pages/admin/AdminWhatsApp"));
const Services             = lazy(() => import("@/pages/Services"));
const UserNew              = lazy(() => import("@/pages/UserNew"));
const UserDetail           = lazy(() => import("@/pages/UserDetail"));
const UserEdit             = lazy(() => import("@/pages/UserEdit"));
const Profile              = lazy(() => import("@/pages/Profile"));
const ImportData           = lazy(() => import("@/pages/ImportData"));
const ReminderLogs         = lazy(() => import("@/pages/ReminderLogs"));
const BusinessHours        = lazy(() => import("@/pages/BusinessHours"));
const SpecialistHours      = lazy(() => import("@/pages/SpecialistHours"));
const PublicBooking        = lazy(() => import("@/pages/PublicBooking"));
const CancelBooking        = lazy(() => import("@/pages/CancelBooking"));
const Marketing            = lazy(() => import("@/pages/Marketing"));
const CampaignEditor       = lazy(() => import("@/pages/CampaignEditor"));
const CampaignHistory      = lazy(() => import("@/pages/CampaignHistory"));
const ReviewHistory        = lazy(() => import("@/pages/ReviewHistory"));
const Unsubscribe          = lazy(() => import("@/pages/Unsubscribe"));
const ConfirmReview        = lazy(() => import("@/pages/ConfirmReview"));
const Index                = lazy(() => import("@/pages/Index"));
const Docs                 = lazy(() => import("@/pages/Docs"));
const NotFound             = lazy(() => import("@/pages/NotFound"));
const Landing              = lazy(() => import("@/pages/Landing"));
const Pipeline             = lazy(() => import("@/pages/Pipeline"));
const Mensagens            = lazy(() => import("@/pages/Mensagens"));
const Equipe               = lazy(() => import("@/pages/Equipe"));
const RecursoAgenda        = lazy(() => import("@/pages/recursos/Agenda"));
const RecursoClientes      = lazy(() => import("@/pages/recursos/Clientes"));
const RecursoFinanceiro    = lazy(() => import("@/pages/recursos/Financeiro"));
const RecursoMarketing     = lazy(() => import("@/pages/recursos/Marketing"));
const RecursoRelatorios    = lazy(() => import("@/pages/recursos/Relatorios"));
const RecursoAgendamentoOnline = lazy(() => import("@/pages/recursos/AgendamentoOnline"));

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

// ─── Splash / loader ──────────────────────────────────────────────────────────
const SPLASH_MS      = 1750;
const SPLASH_FADE_MS = 350;

const PUBLIC_PATHS = new Set(["/", "/login", "/esqueci-senha", "/redefinir-senha"]);
function isPublicPath(p: string) {
  return PUBLIC_PATHS.has(p) || p.startsWith("/recursos") || p.startsWith("/agendar") || p.startsWith("/cancelar") || p.startsWith("/docs");
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const isClinicContext = isClinicSubdomain || isCustomDomain;

function getClinicBrandCache() {
  try { return JSON.parse(localStorage.getItem("brand_" + window.location.hostname) ?? "null"); } catch { return null; }
}

function ClinicSplash({ opacity, fading }: { opacity: number; fading: boolean }) {
  const brand = getClinicBrandCache();
  const bg = brand?.color ?? "#111";
  const logo = brand?.logo_url ? `${brand.logo_url.split("?")[0]}?download=` : null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: bg,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
      opacity, transition: fading ? `opacity ${SPLASH_FADE_MS}ms ease` : "none",
      pointerEvents: fading ? "none" : "auto",
    }}>
      {logo
        ? <img src={logo} alt="" style={{ width: 80, height: 80, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        : <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "splash-spin 0.8s linear infinite" }} />
      }
      <style>{`@keyframes splash-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SplashOverlay() {
  const { pathname } = useLocation();
  const isPublic = isPublicPath(pathname);
  const [phase, setPhase] = useState<"visible" | "fading" | "done">("visible");
  useEffect(() => {
    if (isPublic) return;
    const t1 = setTimeout(() => setPhase("fading"), SPLASH_MS);
    const t2 = setTimeout(() => setPhase("done"), SPLASH_MS + SPLASH_FADE_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isPublic]);
  if (isPublic || phase === "done") return null;
  if (isClinicContext) return <ClinicSplash opacity={phase === "fading" ? 0 : 1} fading={phase === "fading"} />;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "hsl(var(--background))",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: phase === "fading" ? 0 : 1,
      transition: `opacity ${SPLASH_FADE_MS}ms ease`,
      pointerEvents: phase === "fading" ? "none" : "auto",
    }}>
      <LogoDraw size={48} drawDuration={1200} fillDuration={400} fillDelay={150} />
    </div>
  );
}

const PageLoader = () => {
  if (isClinicContext) {
    const brand = getClinicBrandCache();
    const bg = brand?.color ?? "#111";
    const logo = brand?.logo_url ? `${brand.logo_url.split("?")[0]}?download=` : null;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: bg }}>
        {logo
          ? <img src={logo} alt="" style={{ width: 64, height: 64, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          : <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "splash-spin 0.8s linear infinite" }} />
        }
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <LogoDraw size={48} drawDuration={1200} fillDuration={400} fillDelay={150} />
    </div>
  );
};

// ─── Domain-not-found fallback ─────────────────────────────────────────────────
function DomainNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
      </svg>
      <h1 className="text-xl font-semibold">Domínio não reconhecido</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Este endereço não está associado a nenhuma clínica cadastrada.
      </p>
      <a href="https://bellex.beauty" className="text-sm text-primary underline underline-offset-4 mt-2">
        Voltar para bellex.beauty
      </a>
    </div>
  );
}

function CustomDomainGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isPublic = isPublicPath(pathname);
  const [status, setStatus] = useState<"checking" | "ok" | "notfound">("checking");
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("workspace_clinics").select("id").eq("custom_domain", window.location.hostname).maybeSingle()
        .then(({ data }) => setStatus(data ? "ok" : "notfound"));
    });
  }, []);
  // Public pages (login, esqueci-senha, redefinir-senha) render immediately — no gate
  if (isPublic) return <>{children}</>;
  if (status === "checking") return <PageLoader />;
  if (status === "notfound") return <DomainNotFound />;
  return <>{children}</>;
}

// ─── Brand loader (clinic context only) ───────────────────────────────────────
function BrandLoader() {
  const [brand, setBrand] = useState<BrandConfig | null>(() => getClinicBrandCache());
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    loadBrandForDomain().then(b => { if (b) setBrand(b); });
  }, []);
  useEffect(() => {
    if (brand?.name) document.title = brand.name;
  }, [brand]);
  useBrand(brand);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTO 0 — LANDING  (bellex.beauty | www.bellex.beauty)
// ═══════════════════════════════════════════════════════════════════════════════
function LandingRoutes() {
  return (
    <Routes>
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTO 1 — SUPERADMIN  (sa.bellex.beauty)
// ═══════════════════════════════════════════════════════════════════════════════
function SuperAdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/dashboard"     element={<SaDashboard />} />
          <Route path="/workspaces"    element={<SaWorkspaces />} />
          <Route path="/planos-ws"     element={<SaPlanosWS />} />
          <Route path="/financeiro"    element={<SaFinanceiro />} />
          <Route path="/uso-ia"        element={<SaUsoIA />} />
          <Route path="/integracoes"   element={<SaIntegracoes />} />
          <Route path="/configuracoes" element={<SaConfiguracoes />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTO 2 — WORKSPACE  (ws.bellex.beauty)
// ═══════════════════════════════════════════════════════════════════════════════
function WorkspaceRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
        <Route element={<WorkspaceLayout />}>
          <Route path="/dashboard"            element={<WorkspaceDashboard />} />
          <Route path="/clientes"             element={<WorkspaceClientes />} />
          <Route path="/clinicas"             element={<WorkspaceClinics />} />
          <Route path="/clinicas/nova"        element={<WorkspaceClinicNew />} />
          <Route path="/clinicas/:id"         element={<WorkspaceClinicDetail />} />
          <Route path="/planos"               element={<WorkspacePlanos />} />
          <Route path="/planos/novo"          element={<WorkspacePlanEdit />} />
          <Route path="/planos/:id"           element={<WorkspacePlanEdit />} />
          <Route path="/financeiro"           element={<WorkspaceFinanceiro />} />
          <Route path="/usuarios"             element={<WorkspaceUsuarios />} />
          <Route path="/relatorios"           element={<WorkspaceRelatorios />} />
          <Route path="/notificacoes"         element={<WorkspaceNotificacoes />} />
          <Route path="/configuracoes"        element={<WorkspaceConfiguracoes />} />
          <Route path="/suporte"              element={<WorkspaceSuporte />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTO 3 — CLÍNICA  (*.bellex.beauty | custom domain | localhost)
// ═══════════════════════════════════════════════════════════════════════════════
function ClinicRoutes() {
  return (
    <Routes>
      {isBookingDomain ? (
        <>
          <Route path="/" element={<PublicBooking />} />
          <Route path="*" element={<PublicBooking />} />
        </>
      ) : (
        <>
          <Route path="/"                element={<Navigate to="/login" replace />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/esqueci-senha"   element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route path="/design-system"   element={<Index />} />
          <Route path="/agendamento"     element={<PublicBooking />} />
          <Route path="/cancelar/:token" element={<CancelBooking />} />
          <Route path="//cancelar/:token" element={<CancelBooking />} />
          <Route path="/notificacao/cancelar"      element={<Unsubscribe />} />
          <Route path="/avaliacao/confirmar/:token" element={<ConfirmReview />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/resumo"     element={<DashboardHome />} />
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/clientes"   element={<Clients />} />
            <Route path="/clientes/novo"        element={<ClientNew />} />
            <Route path="/clientes/:id"         element={<ClientDetail />} />
            <Route path="/clientes/:id/editar"  element={<ClientEdit />} />
            <Route path="/atendimentos/novo"          element={<AppointmentNew />} />
            <Route path="/atendimentos/:id"           element={<AppointmentDetail />} />
            <Route path="/atendimentos/:id/sessao"    element={<AppointmentSession />} />
            <Route path="/produtos"             element={<Products />} />
            <Route path="/produtos/novo"        element={<ProductNew />} />
            <Route path="/produtos/:id"         element={<ProductDetail />} />
            <Route path="/produtos/:id/editar"  element={<ProductEdit />} />
            <Route path="/cobrancas"            element={<Charges />} />
            <Route path="/cobrancas/nova"       element={<ChargeNew />} />
            <Route path="/cobrancas/:id"        element={<ChargeDetail />} />
            <Route path="/cobrancas/:id/editar" element={<ChargeEdit />} />
            <Route path="/clientes-inativos"    element={<InactiveClients />} />
            <Route path="/faturamento"          element={<Faturamento />} />
            <Route path="/caixa"                element={<CaixaFinanceiro />} />
            <Route path="/relatorios"           element={<Reports />} />
            <Route path="/servicos"             element={<Services />} />
            <Route path="/equipe"               element={<Equipe />} />
            <Route path="/documentos"           element={<Documents />} />
            <Route path="/documentos/:id"       element={<DocumentEdit />} />
            <Route path="/admin"                element={<Admin />} />
            <Route path="/admin/agenda"         element={<AdminAgenda />} />
            <Route path="/admin/email"          element={<AdminEmail />} />
            <Route path="/admin/notificacoes"   element={<AdminNotificacoes />} />
            <Route path="/admin/integracoes"    element={<AdminIntegracoes />} />
            <Route path="/admin/documentos"     element={<AdminDocumentos />} />
            <Route path="/admin/agentes"        element={<AdminAgentes />} />
            <Route path="/admin/whatsapp"       element={<AdminWhatsApp />} />
            <Route path="/admin/usuarios/novo"          element={<UserNew />} />
            <Route path="/admin/usuarios/:id"           element={<UserDetail />} />
            <Route path="/admin/usuarios/:id/editar"    element={<UserEdit />} />
            <Route path="/admin/horarios"               element={<BusinessHours />} />
            <Route path="/admin/horarios-especialistas" element={<SpecialistHours />} />
            <Route path="/admin/importar"       element={<ImportData />} />
            <Route path="/admin/lembretes"      element={<ReminderLogs />} />
            <Route path="/pipeline"             element={<Pipeline />} />
            <Route path="/mensagens"            element={<Mensagens />} />
            <Route path="/marketing"            element={<Marketing />} />
            <Route path="/marketing/historico"              element={<CampaignHistory />} />
            <Route path="/marketing/avaliacoes/historico"   element={<ReviewHistory />} />
            <Route path="/marketing/nova"       element={<CampaignEditor />} />
            <Route path="/marketing/:id"        element={<CampaignEditor />} />
            <Route path="/perfil"               element={<Profile />} />
          </Route>

          <Route path="/docs"            element={<ProtectedRoute><Docs /></ProtectedRoute>} />
          <Route path="/docs/:group/:slug" element={<ProtectedRoute><Docs /></ProtectedRoute>} />

          <Route path="/"                            element={<Navigate to="/login" replace />} />
          <Route path="/recursos/agenda"             element={<RecursoAgenda />} />
          <Route path="/recursos/clientes"           element={<RecursoClientes />} />
          <Route path="/recursos/financeiro"         element={<RecursoFinanceiro />} />
          <Route path="/recursos/marketing"          element={<RecursoMarketing />} />
          <Route path="/recursos/relatorios"         element={<RecursoRelatorios />} />
          <Route path="/recursos/agendamento-online" element={<RecursoAgendamentoOnline />} />
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      {isSuperAdminDomain ? <SuperAdminRoutes /> :
       isWorkspaceDomain  ? <WorkspaceRoutes />  :
       isLandingDomain    ? <LandingRoutes />    :
       isCustomDomain     ? <CustomDomainGate><ClinicRoutes /></CustomDomainGate> :
                            <ClinicRoutes />}
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          {(isClinicSubdomain || isCustomDomain) && <BrandLoader />}
          <SplashOverlay />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

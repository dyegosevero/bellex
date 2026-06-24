import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import { LogoDraw } from "@/components/ui/logo-draw";
import { loadBrandForDomain, useBrand, type BrandConfig } from "@/hooks/useBrand";

// Build mode — "clinic" removes Workspace/SuperAdmin routes (used for whitelabel deploys)
const IS_CLINIC_BUILD = import.meta.env.VITE_APP_MODE === "clinic";

// Lazy-loaded pages — only fetched when the route is accessed
const Login = lazy(() => import("@/pages/Login"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DashboardHome = lazy(() => import("@/pages/DashboardHome"));
const Documents = lazy(() => import("@/pages/Documents"));
const DocumentEdit = lazy(() => import("@/pages/DocumentEdit"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const ClientNew = lazy(() => import("@/pages/ClientNew"));
const ClientEdit = lazy(() => import("@/pages/ClientEdit"));

const AppointmentNew = lazy(() => import("@/pages/AppointmentNew"));
const AppointmentDetail = lazy(() => import("@/pages/AppointmentDetail"));
const AppointmentSession = lazy(() => import("@/pages/AppointmentSession"));
const Products = lazy(() => import("@/pages/Products"));
const ProductNew = lazy(() => import("@/pages/ProductNew"));
const ProductEdit = lazy(() => import("@/pages/ProductEdit"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const CaixaFinanceiro = lazy(() => import("@/pages/CaixaFinanceiro"));
const Charges = lazy(() => import("@/pages/Charges"));
const Faturamento = lazy(() => import("@/pages/Faturamento"));
const ChargeNew = lazy(() => import("@/pages/ChargeNew"));
const ChargeDetail = lazy(() => import("@/pages/ChargeDetail"));
const ChargeEdit = lazy(() => import("@/pages/ChargeEdit"));
const InactiveClients = lazy(() => import("@/pages/InactiveClients"));
const Reports = lazy(() => import("@/pages/Reports"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminAgenda = lazy(() => import("@/pages/admin/AdminAgenda"));
const AdminEmail = lazy(() => import("@/pages/admin/AdminEmail"));
const AdminNotificacoes = lazy(() => import("@/pages/admin/AdminNotificacoes"));
const AdminIntegracoes = lazy(() => import("@/pages/admin/AdminIntegracoes"));
const AdminDocumentos = lazy(() => import("@/pages/admin/AdminDocumentos"));
const AdminAgentes = lazy(() => import("@/pages/admin/AdminAgentes"));
const AdminWhatsApp = lazy(() => import("@/pages/admin/AdminWhatsApp"));
const Services = lazy(() => import("@/pages/Services"));
const UserNew = lazy(() => import("@/pages/UserNew"));
const UserDetail = lazy(() => import("@/pages/UserDetail"));
const UserEdit = lazy(() => import("@/pages/UserEdit"));
const Profile = lazy(() => import("@/pages/Profile"));
const ImportData = lazy(() => import("@/pages/ImportData"));
const ReminderLogs = lazy(() => import("@/pages/ReminderLogs"));
const BusinessHours = lazy(() => import("@/pages/BusinessHours"));
const SpecialistHours = lazy(() => import("@/pages/SpecialistHours"));

const PublicBooking = lazy(() => import("@/pages/PublicBooking"));
const CancelBooking = lazy(() => import("@/pages/CancelBooking"));
const Marketing = lazy(() => import("@/pages/Marketing"));
const CampaignEditor = lazy(() => import("@/pages/CampaignEditor"));
const CampaignHistory = lazy(() => import("@/pages/CampaignHistory"));
const ReviewHistory = lazy(() => import("@/pages/ReviewHistory"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));
const ConfirmReview = lazy(() => import("@/pages/ConfirmReview"));
const Index = lazy(() => import("@/pages/Index"));
const Docs = lazy(() => import("@/pages/Docs"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Landing = lazy(() => import("@/pages/Landing"));
const Pipeline = lazy(() => import("@/pages/Pipeline"));
const Mensagens = lazy(() => import("@/pages/Mensagens"));
const Equipe = lazy(() => import("@/pages/Equipe"));
const RecursoAgenda = lazy(() => import("@/pages/recursos/Agenda"));
const RecursoClientes = lazy(() => import("@/pages/recursos/Clientes"));
const RecursoFinanceiro = lazy(() => import("@/pages/recursos/Financeiro"));
const RecursoMarketing = lazy(() => import("@/pages/recursos/Marketing"));
const RecursoRelatorios = lazy(() => import("@/pages/recursos/Relatorios"));
const RecursoAgendamentoOnline = lazy(() => import("@/pages/recursos/AgendamentoOnline"));

// Workspace (Tenant Admin) — excluded from clinic builds
const SuperAdminLayout = IS_CLINIC_BUILD ? null : lazy(() => import("@/components/SuperAdminLayout"));
const SaDashboard = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/superadmin/SaDashboard"));
const SaClientes = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/superadmin/SaClientes"));
const SaIntegracoes = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/superadmin/SaIntegracoes"));
const SaFinanceiro = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/superadmin/SaFinanceiro"));
const SaStorage = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/superadmin/SaStorage"));
const SaIA = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/superadmin/SaIA"));
const SaConfiguracoes = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/superadmin/SaConfiguracoes"));
const WorkspaceLayout = IS_CLINIC_BUILD ? null : lazy(() => import("@/components/WorkspaceLayout"));
const WorkspaceDashboard = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceDashboard"));
const WorkspaceClientes = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceClientes"));
const WorkspaceClinics = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceClinics"));
const WorkspaceClinicDetail = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceClinicDetail"));
const WorkspacePlanos = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspacePlanos"));
const WorkspaceFinanceiro = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceFinanceiro"));
const WorkspaceLicencas = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceLicencas"));
const WorkspaceUsuarios = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceUsuarios"));
const WorkspaceRelatorios = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceRelatorios"));
const WorkspaceNotificacoes = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceNotificacoes"));
const WorkspaceClinicNew = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceClinicNew"));
const WorkspaceConfiguracoes = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceConfiguracoes"));
const WorkspaceSuporte = IS_CLINIC_BUILD ? null : lazy(() => import("@/pages/workspace/WorkspaceSuporte"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Total da animação: drawDuration + fillDelay + fillDuration = 1200 + 150 + 400 = 1750ms
const SPLASH_MS = 1750;
const SPLASH_FADE_MS = 350;

const PUBLIC_PATHS = new Set(["/", "/login", "/esqueci-senha", "/redefinir-senha"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname)
    || pathname.startsWith("/recursos")
    || pathname.startsWith("/agendar")
    || pathname.startsWith("/cancelar")
    || pathname.startsWith("/docs");
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
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "hsl(var(--background))",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${SPLASH_FADE_MS}ms ease`,
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
    >
      <LogoDraw size={48} drawDuration={1200} fillDuration={400} fillDelay={150} />
    </div>
  );
}

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
    <LogoDraw size={48} drawDuration={1200} fillDuration={400} fillDelay={150} />
  </div>
);

const isBookingDomain = window.location.hostname.startsWith("agendamento.");

// Domínios que pertencem à própria Bellex — nunca precisam de validação de tenant
const BELLEX_OWNED_HOSTS = new Set([
  "bellex.beauty",
  "www.bellex.beauty",
  "ws.bellex.beauty",
  "localhost",
  "127.0.0.1",
]);

const hostname = window.location.hostname;

const isWorkspaceDomain = hostname === "ws.bellex.beauty";
const isCustomDomain =
  !BELLEX_OWNED_HOSTS.has(hostname) &&
  !hostname.endsWith(".bellex.beauty") &&
  !isBookingDomain;

function DomainNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
      </svg>
      <h1 className="text-xl font-semibold text-foreground">Domínio não reconhecido</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Este endereço não está associado a nenhuma clínica cadastrada no sistema.
      </p>
      <a href="https://bellex.beauty" className="text-sm text-primary underline underline-offset-4 mt-2">
        Voltar para bellex.beauty
      </a>
    </div>
  );
}

function CustomDomainGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ok" | "notfound">("checking");

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("workspace_clinics")
        // Seleciona apenas id — mínimo necessário para validar existência
        .select("id")
        .eq("custom_domain", hostname)
        .maybeSingle()
        .then(({ data }) => setStatus(data ? "ok" : "notfound"));
    });
  }, []);

  if (status === "checking") return <PageLoader />;
  if (status === "notfound") return <DomainNotFound />;
  return <>{children}</>;
}

function AnimatedRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
            {isBookingDomain ? (
              <>
                <Route path="/" element={<PublicBooking />} />
                <Route path="*" element={<PublicBooking />} />
              </>
            ) : isWorkspaceDomain ? (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="/esqueci-senha" element={<ForgotPassword />} />
                <Route path="/redefinir-senha" element={<ResetPassword />} />
                <Route path="/" element={<Navigate to="/workspace" replace />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/workspace" element={<WorkspaceLayout />}>
                    <Route index element={WorkspaceDashboard ? <WorkspaceDashboard /> : null} />
                    <Route path="clientes" element={WorkspaceClientes ? <WorkspaceClientes /> : null} />
                    <Route path="clinicas" element={WorkspaceClinics ? <WorkspaceClinics /> : null} />
                    <Route path="clinicas/nova" element={WorkspaceClinicNew ? <WorkspaceClinicNew /> : null} />
                    <Route path="clinicas/:id" element={WorkspaceClinicDetail ? <WorkspaceClinicDetail /> : null} />
                    <Route path="planos" element={WorkspacePlanos ? <WorkspacePlanos /> : null} />
                    <Route path="financeiro" element={WorkspaceFinanceiro ? <WorkspaceFinanceiro /> : null} />
                    <Route path="licencas" element={WorkspaceLicencas ? <WorkspaceLicencas /> : null} />
                    <Route path="usuarios" element={WorkspaceUsuarios ? <WorkspaceUsuarios /> : null} />
                    <Route path="relatorios" element={WorkspaceRelatorios ? <WorkspaceRelatorios /> : null} />
                    <Route path="notificacoes" element={WorkspaceNotificacoes ? <WorkspaceNotificacoes /> : null} />
                    <Route path="configuracoes" element={WorkspaceConfiguracoes ? <WorkspaceConfiguracoes /> : null} />
                    <Route path="suporte" element={WorkspaceSuporte ? <WorkspaceSuporte /> : null} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/workspace" replace />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="/esqueci-senha" element={<ForgotPassword />} />
                <Route path="/redefinir-senha" element={<ResetPassword />} />
                <Route path="/design-system" element={<Index />} />
                <Route path="/agendamento" element={<PublicBooking />} />
                <Route path="/cancelar/:token" element={<CancelBooking />} />
                <Route path="//cancelar/:token" element={<CancelBooking />} />
                <Route path="/notificacao/cancelar" element={<Unsubscribe />} />
                <Route path="/avaliacao/confirmar/:token" element={<ConfirmReview />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/resumo" element={<DashboardHome />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/clientes" element={<Clients />} />
                  <Route path="/clientes/novo" element={<ClientNew />} />
                  <Route path="/clientes/:id" element={<ClientDetail />} />
                  <Route path="/clientes/:id/editar" element={<ClientEdit />} />
                  
                  <Route path="/atendimentos/novo" element={<AppointmentNew />} />
                  <Route path="/atendimentos/:id" element={<AppointmentDetail />} />
                  <Route path="/atendimentos/:id/sessao" element={<AppointmentSession />} />
                  <Route path="/produtos" element={<Products />} />
                  <Route path="/produtos/novo" element={<ProductNew />} />
                  <Route path="/produtos/:id" element={<ProductDetail />} />
                  <Route path="/produtos/:id/editar" element={<ProductEdit />} />
                  <Route path="/cobrancas" element={<Charges />} />
                  <Route path="/cobrancas/nova" element={<ChargeNew />} />
                  
                  <Route path="/cobrancas/:id" element={<ChargeDetail />} />
                  <Route path="/cobrancas/:id/editar" element={<ChargeEdit />} />
                  <Route path="/clientes-inativos" element={<InactiveClients />} />
                  <Route path="/faturamento" element={<Faturamento />} />
                  <Route path="/caixa" element={<CaixaFinanceiro />} />
                  <Route path="/relatorios" element={<Reports />} />
                  <Route path="/servicos" element={<Services />} />
                  <Route path="/equipe" element={<Equipe />} />
                  <Route path="/documentos" element={<Documents />} />
                  <Route path="/documentos/:id" element={<DocumentEdit />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/agenda" element={<AdminAgenda />} />
                  <Route path="/admin/email" element={<AdminEmail />} />
                  <Route path="/admin/notificacoes" element={<AdminNotificacoes />} />
                  <Route path="/admin/integracoes" element={<AdminIntegracoes />} />
                  <Route path="/admin/documentos" element={<AdminDocumentos />} />
                  <Route path="/admin/agentes" element={<AdminAgentes />} />
                  <Route path="/admin/whatsapp" element={<AdminWhatsApp />} />
                  <Route path="/admin/usuarios/novo" element={<UserNew />} />
                  <Route path="/admin/usuarios/:id" element={<UserDetail />} />
                  <Route path="/admin/usuarios/:id/editar" element={<UserEdit />} />
                  <Route path="/admin/horarios" element={<BusinessHours />} />
                  <Route path="/admin/horarios-especialistas" element={<SpecialistHours />} />
                  <Route path="/admin/importar" element={<ImportData />} />
                  <Route path="/admin/lembretes" element={<ReminderLogs />} />
                  
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/mensagens" element={<Mensagens />} />
                  <Route path="/marketing" element={<Marketing />} />
                  <Route path="/marketing/historico" element={<CampaignHistory />} />
                  <Route path="/marketing/avaliacoes/historico" element={<ReviewHistory />} />
                  <Route path="/marketing/nova" element={<CampaignEditor />} />
                  <Route path="/marketing/:id" element={<CampaignEditor />} />
                  <Route path="/perfil" element={<Profile />} />
                </Route>

                <Route path="/docs" element={<ProtectedRoute><Docs /></ProtectedRoute>} />
                <Route path="/docs/:group/:slug" element={<ProtectedRoute><Docs /></ProtectedRoute>} />


                <Route path="/" element={<Landing />} />
                <Route path="/recursos/agenda" element={<RecursoAgenda />} />
                <Route path="/recursos/clientes" element={<RecursoClientes />} />
                <Route path="/recursos/financeiro" element={<RecursoFinanceiro />} />
                <Route path="/recursos/marketing" element={<RecursoMarketing />} />
                <Route path="/recursos/relatorios" element={<RecursoRelatorios />} />
                <Route path="/recursos/agendamento-online" element={<RecursoAgendamentoOnline />} />

                {/* Workspace — Tenant Admin (excluded from clinic builds) */}
                {!IS_CLINIC_BUILD && SuperAdminLayout && (
                  <Route path="/superadmin" element={<SuperAdminLayout />}>
                    <Route index element={SaDashboard ? <SaDashboard /> : null} />
                    <Route path="clientes" element={SaClientes ? <SaClientes /> : null} />
                    <Route path="integracoes" element={SaIntegracoes ? <SaIntegracoes /> : null} />
                    <Route path="financeiro" element={SaFinanceiro ? <SaFinanceiro /> : null} />
                    <Route path="storage" element={SaStorage ? <SaStorage /> : null} />
                    <Route path="ia" element={SaIA ? <SaIA /> : null} />
                    <Route path="configuracoes" element={SaConfiguracoes ? <SaConfiguracoes /> : null} />
                  </Route>
                )}

                {!IS_CLINIC_BUILD && WorkspaceLayout && (
                  <Route path="/workspace" element={<WorkspaceLayout />}>
                    <Route index element={WorkspaceDashboard ? <WorkspaceDashboard /> : null} />
                    <Route path="clientes" element={WorkspaceClientes ? <WorkspaceClientes /> : null} />
                    <Route path="clinicas" element={WorkspaceClinics ? <WorkspaceClinics /> : null} />
                    <Route path="clinicas/nova" element={WorkspaceClinicNew ? <WorkspaceClinicNew /> : null} />
                    <Route path="clinicas/:id" element={WorkspaceClinicDetail ? <WorkspaceClinicDetail /> : null} />
                    <Route path="planos" element={WorkspacePlanos ? <WorkspacePlanos /> : null} />
                    <Route path="financeiro" element={WorkspaceFinanceiro ? <WorkspaceFinanceiro /> : null} />
                    <Route path="licencas" element={WorkspaceLicencas ? <WorkspaceLicencas /> : null} />
                    <Route path="usuarios" element={WorkspaceUsuarios ? <WorkspaceUsuarios /> : null} />
                    <Route path="relatorios" element={WorkspaceRelatorios ? <WorkspaceRelatorios /> : null} />
                    <Route path="notificacoes" element={WorkspaceNotificacoes ? <WorkspaceNotificacoes /> : null} />
                    <Route path="configuracoes" element={WorkspaceConfiguracoes ? <WorkspaceConfiguracoes /> : null} />
                    <Route path="suporte" element={WorkspaceSuporte ? <WorkspaceSuporte /> : null} />
                  </Route>
                )}

                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </Suspense>
  );
}

function BrandLoader() {
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    loadBrandForDomain().then(b => { if (b) setBrand(b); });
  }, []);
  useBrand(brand);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          {IS_CLINIC_BUILD && <BrandLoader />}
          <SplashOverlay />
          {isCustomDomain ? (
            <CustomDomainGate>
              <AnimatedRoutes />
            </CustomDomainGate>
          ) : (
            <AnimatedRoutes />
          )}
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

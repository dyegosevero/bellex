import { useMemo, useState, useCallback, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";

class SessionErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("SessionErrorBoundary caught:", error, info); }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div className="p-8 space-y-3 max-w-xl mx-auto">
          <p className="text-destructive font-medium">Erro ao carregar a sessão</p>
          <pre className="text-xs bg-muted p-4 rounded-xl overflow-auto whitespace-pre-wrap">{err.message}\n{err.stack}</pre>
          <button className="text-sm text-primary underline" onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllServices as useServices } from "@/hooks/useAppointmentData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SlidingTabsList } from "@/components/ui/sliding-tabs-list";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, User, ClipboardList, ShoppingBag, Camera, FileText,
  CheckCircle2, XCircle, Clock, Sparkles, Calendar as CalendarIcon, MessageSquareText,
} from "lucide-react";
import { fmtDateLong, fmtTime } from "@/lib/date";
import { toast } from "sonner";
import SessionDataTab from "@/components/appointment-session/SessionDataTab";
import SessionFormsTab from "@/components/appointment-session/SessionFormsTab";
import SessionPurchasesTab from "@/components/appointment-session/SessionPurchasesTab";
import SessionBeforeAfterTab from "@/components/appointment-session/SessionBeforeAfterTab";
import SessionDocumentsTab from "@/components/appointment-session/SessionDocumentsTab";
import CompletionSignatureDialog from "@/components/appointment-session/CompletionSignatureDialog";
import ConsentDialog from "@/components/appointment-session/ConsentDialog";
import { fireBookingWebhook } from "@/lib/webhook";

const STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  em_atendimento: "Em atendimento",
  realizado: "Realizado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  agendado: "bg-blue-500/10 text-blue-700 border-blue-200",
  em_atendimento: "bg-amber-500/10 text-amber-700 border-amber-200",
  realizado: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  concluido: "bg-primary/10 text-primary border-primary/20",
  cancelado: "bg-red-500/10 text-red-700 border-red-200",
};

const AppointmentSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSpecialist, isAdmin } = useAuth();
  const { data: services } = useServices();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [notifyClientOnCancel, setNotifyClientOnCancel] = useState(true);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const { data: appointment, isLoading } = useQuery({
    queryKey: ["appointment-session", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(*)")
        .eq("id", id!)
        .single();
      if (error) {
        console.error("appointment-session load error:", error);
        throw error;
      }

      let specialist_name = "—";
      let specialist_avatar: string | null = null;
      if (data.specialist_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", data.specialist_id)
          .maybeSingle();
        if (prof) {
          specialist_name = prof.full_name;
          specialist_avatar = prof.avatar_url;
        }
      }
      return { ...data, specialist_name, specialist_avatar };
    },
    enabled: !!id,
  });

  const { data: appointmentServices } = useQuery({
    queryKey: ["appointment-services", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointment_services")
        .select("service_id")
        .eq("appointment_id", id!);
      return data ?? [];
    },
    enabled: !!id,
  });

  // Fetch service config for conditional tabs
  const serviceId = appointment?.service_id;
  const { data: serviceConfig } = useQuery({
    queryKey: ["service-config", serviceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("requires_before_after_photos, requires_consent_form, requires_assessment_form, assessment_form_type, requires_completion_signature, multi_session, session_count, name, consent_policy")
        .eq("id", serviceId!)
        .single();
      return data;
    },
    enabled: !!serviceId,
  });

  // Count completed sessions for multi-session services
  const isMultiSession = (serviceConfig as any)?.multi_session ?? false;
  const totalSessions = (serviceConfig as any)?.session_count ?? 0;
  const { data: completedSessionCount } = useQuery({
    queryKey: ["completed-sessions", appointment?.client_id, serviceId],
    queryFn: async () => {
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("client_id", appointment!.client_id)
        .eq("service_id", serviceId!)
        .in("status", ["realizado", "concluido"]);
      return count ?? 0;
    },
    enabled: !!appointment?.client_id && !!serviceId && isMultiSession && totalSessions > 0,
  });
  const remainingSessions = isMultiSession && totalSessions > 0
    ? Math.max(0, totalSessions - (completedSessionCount ?? 0))
    : null;

  // Session number from dedicated column
  const currentSessionNumber = isMultiSession ? (appointment as any)?.session_number ?? null : null;

  const showBeforeAfter = serviceConfig?.requires_before_after_photos ?? false;
  const showFichas = serviceConfig?.requires_assessment_form ?? false;
  const showConsent = serviceConfig?.requires_consent_form ?? false;
  const consentPolicy: "none" | "once" | "always" = ((serviceConfig as any)?.consent_policy as any) ?? (showConsent ? "once" : "none");
  const requiresCompletionSignature = (serviceConfig as any)?.requires_completion_signature ?? false;

  // Auto-open consent dialog based on service policy
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const autoOpenedRef = useRef(false);
  const { data: existingConsents, isLoading: loadingConsents } = useQuery({
    queryKey: ["session-consents", appointment?.client_id, serviceId, id],
    queryFn: async () => {
      const { data: consents } = await supabase
        .from("client_consents")
        .select("id, appointment_id, signed_at")
        .eq("client_id", appointment!.client_id)
        .eq("is_valid", true)
        .not("signed_at", "is", null);
      const list = consents ?? [];
      const apptIds = Array.from(new Set(list.map((c: any) => c.appointment_id).filter(Boolean)));
      let serviceById: Record<string, string | null> = {};
      if (apptIds.length > 0) {
        const { data: appts } = await supabase
          .from("appointments")
          .select("id, service_id")
          .in("id", apptIds);
        (appts ?? []).forEach((a: any) => { serviceById[a.id] = a.service_id; });
      }
      return list.map((c: any) => ({ ...c, service_id: c.appointment_id ? serviceById[c.appointment_id] : null }));
    },
    enabled: !!appointment?.client_id && !!serviceId && consentPolicy !== "none",
  });

  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (consentPolicy === "none") return;
    if (!appointment || !serviceId || loadingConsents) return;
    const list = existingConsents ?? [];
    if (consentPolicy === "always") {
      // Need a consent specifically for THIS appointment
      const hasForThisAppt = list.some((c: any) => c.appointment_id === id);
      if (!hasForThisAppt) {
        autoOpenedRef.current = true;
        setConsentDialogOpen(true);
      }
    } else if (consentPolicy === "once") {
      // Already signed for the same service?
      const hasForSameService = list.some((c: any) => c.service_id === serviceId);
      if (!hasForSameService) {
        autoOpenedRef.current = true;
        setConsentDialogOpen(true);
      }
    }
  }, [consentPolicy, existingConsents, loadingConsents, appointment, serviceId, id]);

  const serviceName = useMemo(() => {
    if (!services || !appointment) return "—";
    if (appointmentServices && appointmentServices.length > 1) {
      return appointmentServices
        .map((as) => services.find((s) => s.id === as.service_id)?.name)
        .filter(Boolean)
        .join(", ") || "—";
    }
    return services.find((s) => s.id === appointment?.service_id)?.name ?? "—";
  }, [services, appointmentServices, appointment]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["appointment-session", id] });
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
  };

  const handleStartSession = async () => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "em_atendimento" })
      .eq("id", id!);
    if (error) {
      console.error("handleStartSession error:", error);
      toast.error(`Erro ao iniciar atendimento: ${error.message}`);
      return;
    }
    toast.success("Atendimento iniciado.");
    invalidateAll();
  };

  const handleFinalizeClick = () => {
    if (requiresCompletionSignature) {
      setSignatureDialogOpen(true);
    } else {
      handleFinalizeAfterSignature();
    }
  };

  const handleFinalizeAfterSignature = async () => {
    // Deduct stock for all products sold in this session (via SECURITY DEFINER RPC)
    const { error: stockErr } = await supabase.rpc("deduct_appointment_stock", { p_appointment_id: id! });
    if (stockErr) {
      toast.error(stockErr.message || "Erro ao baixar stock — finalização cancelada.");
      return;
    }

    // If a different user (e.g. receptionist) is finalizing, append a note
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("full_name, user_id")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .maybeSingle();

    let updatedNotes: Record<string, unknown> = { status: "realizado" };
    if (currentProfile && appointment.specialist_id && currentProfile.user_id !== appointment.specialist_id) {
      const existing = appointment.notes ?? "";
      const roleLabel = isAdmin ? "admin" : "recepção";
      const addendum = `\n\n📋 Finalizado por ${currentProfile.full_name} (${roleLabel}).`;
      updatedNotes.notes = existing + addendum;
    }

    const { error } = await supabase
      .from("appointments")
      .update(updatedNotes)
      .eq("id", id!);
    if (error) { toast.error("Erro ao finalizar."); return; }
    toast.success("Procedimento finalizado — atendimento marcado como Realizado.");
    invalidateAll();
    queryClient.invalidateQueries({ queryKey: ["appointment-documents", id] });
    queryClient.invalidateQueries({ queryKey: ["products-active"] });
  };

  const handleCancel = async () => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelado" })
      .eq("id", id!);
    if (error) { toast.error("Erro ao cancelar."); return; }
    toast.success("Atendimento cancelado.");
    invalidateAll();
    setCancelDialogOpen(false);

    // Always fire webhook — n8n decides whether to notify
    if (appointment) {
      const svc = services?.find((s: any) => s.id === appointment.service_id);
      fireBookingWebhook({
        event: "cancelled",
        appointment_id: id!,
        notify_client: notifyClientOnCancel,
        cancellation_token: appointment.cancellation_token || undefined,
        client: {
          full_name: (appointment.clients as any)?.full_name || "",
          phone: (appointment.clients as any)?.phone || null,
          email: (appointment.clients as any)?.email || null,
        },
        client_id: appointment.client_id || null,
        service_id: appointment.service_id || null,
        service_name: svc?.name || null,
        start_time: appointment.start_time,
        specialist_name: appointment.specialist_name || null,
        specialist_id: appointment.specialist_id || null,
      });
    }

    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!appointment) {
    return <p className="text-muted-foreground text-center py-12">Atendimento não encontrado.</p>;
  }

  const client = appointment.clients as any;
  const status = appointment.status;
  const statusCls = STATUS_COLORS[status] ?? STATUS_COLORS.agendado;
  const initials = (appointment.specialist_name || "?")
    .split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/atendimentos/${id}`)} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-light tracking-wider">
              Sessão de Atendimento
              {isMultiSession && currentSessionNumber != null && totalSessions > 0 && (
                <span className="ml-2 text-base text-muted-foreground font-normal">
                  #{currentSessionNumber} de {totalSessions}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {fmtDateLong(appointment.start_time)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {status === "agendado" && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleStartSession}
            >
              <Clock className="w-3.5 h-3.5" /> Iniciar Atendimento
            </Button>
          )}
          {status === "em_atendimento" && (
            <Button
              size="sm"
              className="gap-1.5 bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white"
              onClick={handleFinalizeClick}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar Procedimento
            </Button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <InfoCard
          icon={<User className="w-4 h-4 text-muted-foreground" />}
          label="Cliente"
          value={client?.full_name ?? "—"}
          onClick={() => navigate(`/clientes/${appointment.client_id}`)}
        />
        <InfoCard
          icon={
            <Avatar className="w-5 h-5">
              <AvatarImage src={appointment.specialist_avatar || undefined} />
              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
          }
          label="Especialista"
          value={appointment.specialist_name}
        />
        <InfoCard
          icon={<Sparkles className="w-4 h-4 text-muted-foreground" />}
          label="Serviço"
          value={serviceName}
        />
        <InfoCard
          icon={<Clock className="w-4 h-4 text-muted-foreground" />}
          label="Horário"
          value={`${fmtTime(appointment.start_time)}${appointment.end_time ? ` – ${fmtTime(appointment.end_time)}` : ""}`}
        />
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</p>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusCls}`}>
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>
      </div>




      {remainingSessions !== null && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
          <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
          <span className="text-foreground">
            <strong>Sessão #{currentSessionNumber ?? "?"}</strong> de <strong>{totalSessions}</strong> · <strong>{completedSessionCount ?? 0}</strong> realizada{(completedSessionCount ?? 0) !== 1 ? "s" : ""} · <strong>{remainingSessions}</strong> restante{remainingSessions !== 1 ? "s" : ""}
          </span>
        </div>
      )}
      {/* Observações do atendimento */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <MessageSquareText className="w-4 h-4 text-muted-foreground" />
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Observações do Atendimento</label>
          {savingNotes && <span className="text-[10px] text-muted-foreground animate-pulse">Salvando...</span>}
        </div>
        <Textarea
          rows={4}
          placeholder="Anotações, observações ou detalhes sobre este atendimento..."
          className="resize-none text-sm"
          value={notes ?? appointment.notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={async () => {
            const val = notes;
            if (val === null || val === (appointment.notes ?? "")) return;
            setSavingNotes(true);
            const { error } = await supabase.from("appointments").update({ notes: val }).eq("id", id!);
            setSavingNotes(false);
            if (error) { toast.error("Erro ao salvar observações."); return; }
            invalidateAll();
          }}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dados" className="space-y-4">
        <SlidingTabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dados" className="t-tab gap-1.5">
            <User className="w-3.5 h-3.5" /> Dados do Cliente
          </TabsTrigger>
          {showFichas && (
            <TabsTrigger value="fichas" className="t-tab gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" /> Fichas Clínicas
            </TabsTrigger>
          )}
          {showBeforeAfter && (
            <TabsTrigger value="antes-depois" className="t-tab gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Antes e Depois
            </TabsTrigger>
          )}
          <TabsTrigger value="compras" className="t-tab gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Compras / Produtos
          </TabsTrigger>
          <TabsTrigger value="documentos" className="t-tab gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Documentos
          </TabsTrigger>
        </SlidingTabsList>

        <TabsContent value="dados">
          <SessionDataTab client={client} clientId={appointment.client_id} onSaved={() => invalidateAll()} />
        </TabsContent>

        {showFichas && (
          <TabsContent value="fichas">
            <SessionFormsTab appointmentId={id!} clientId={appointment.client_id} serviceId={appointment.service_id} />
          </TabsContent>
        )}

        {showBeforeAfter && (
          <TabsContent value="antes-depois">
            <SessionBeforeAfterTab
              appointmentId={id!}
              clientId={appointment.client_id}
              clientName={client?.full_name ?? ""}
              serviceId={appointment.service_id}
              requiresConsent={showConsent}
            />
          </TabsContent>
        )}

        <TabsContent value="compras">
          <SessionPurchasesTab appointmentId={id!} />
        </TabsContent>

        <TabsContent value="documentos">
          <SessionDocumentsTab appointmentId={id!} clientId={appointment.client_id} />
        </TabsContent>
      </Tabs>

      {/* Auto-triggered Consent Dialog */}
      <ConsentDialog
        open={consentDialogOpen}
        onOpenChange={setConsentDialogOpen}
        clientId={appointment.client_id}
        clientName={client?.full_name ?? ""}
        appointmentId={id!}
        onConsentSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["session-consents", appointment.client_id, serviceId, id] });
          queryClient.invalidateQueries({ queryKey: ["appointment-documents", id] });
          queryClient.invalidateQueries({ queryKey: ["client-consents", appointment.client_id] });
        }}
      />


      {/* Completion Signature Dialog */}
      <CompletionSignatureDialog
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        appointmentId={id!}
        clientId={appointment.client_id}
        clientName={client?.full_name ?? ""}
        serviceName={serviceName}
        specialistName={appointment.specialist_name}
        startTime={appointment.start_time}
        endTime={appointment.end_time}
        required={requiresCompletionSignature}
        onSigned={handleFinalizeAfterSignature}
      />

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={(o) => { setCancelDialogOpen(o); if (!o) setNotifyClientOnCancel(true); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja cancelar este atendimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 px-1">
            <Checkbox id="notify-cancel-session" checked={notifyClientOnCancel} onCheckedChange={(v) => setNotifyClientOnCancel(!!v)} />
            <label htmlFor="notify-cancel-session" className="text-sm cursor-pointer select-none">Notificar cliente</label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function InfoCard({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-lg p-3 ${onClick ? "cursor-pointer hover:border-primary/40 transition-colors" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}

export default function AppointmentSessionPage() {
  return (
    <SessionErrorBoundary>
      <AppointmentSession />
    </SessionErrorBoundary>
  );
}

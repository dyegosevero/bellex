import { useState, useMemo, Component, type ReactNode, type ErrorInfo } from "react";

class DetailErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  componentDidCatch(e: Error, info: ErrorInfo) { console.error("AppointmentDetail error:", e, info); }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div className="p-8 space-y-3 max-w-xl mx-auto">
          <p className="text-destructive font-medium">Erro ao carregar atendimento</p>
          <pre className="text-xs bg-muted p-4 rounded-xl overflow-auto whitespace-pre-wrap">{err.message}{"\n"}{err.stack}</pre>
          <button className="text-sm text-primary underline" onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { useAllServices as useServices, useServiceFormFields, useSpecialists } from "@/hooks/useAppointmentData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Image as ImageIcon, Star, MessageSquare, Loader2, CheckCircle2, XCircle, ClipboardList, Clock, Timer, Banknote, Receipt, Eye, X, Trash2 } from "lucide-react";
import { fmtCurrency, fmtDateLong, fmtDateShort, fmtTime } from "@/lib/date";
import { toast } from "sonner";
import FeedbackDialog from "@/components/appointments/FeedbackDialog";
import FeedbackInlineForm from "@/components/appointments/FeedbackInlineForm";
import { useAuth } from "@/contexts/AuthContext";
import { fireBookingWebhook } from "@/lib/webhook";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { useFeedbackEnabled } from "@/hooks/useFeedbackEnabled";


const AppointmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: services } = useServices();
  const { isSpecialist, isAdmin } = useAuth();
  const feedbackEnabled = useFeedbackEnabled();

  const { data: appointment, isLoading } = useQuery({
    queryKey: ["appointment-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(full_name, phone)")
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      let specialist_name = "—";
      if (data.specialist_id) {
        const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", data.specialist_id).maybeSingle();
        if (prof) specialist_name = prof.full_name;
      }
      return { ...data, specialist_name };
    },
    enabled: !!id,
  });

  // Fetch appointment_services for multi-service display
  const { data: appointmentServices } = useQuery({
    queryKey: ["appointment-services", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_services")
        .select("service_id")
        .eq("appointment_id", id!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: formFields } = useServiceFormFields(appointment?.service_id ?? null);

  const { data: formResponses } = useQuery({
    queryKey: ["appointment-responses", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointment_form_responses").select("*").eq("appointment_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: soldProducts } = useQuery({
    queryKey: ["appointment-products", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointment_products").select("*, products(name)").eq("appointment_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Check if a charge already exists for this appointment
  const { data: existingCharge } = useQuery({
    queryKey: ["appointment-charge", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charges")
        .select("id, amount, status, paid_at, due_date, created_at")
        .eq("appointment_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch photos from client_images for THIS appointment only
  const { data: beforeAfterImages } = useQuery({
    queryKey: ["appointment-ba-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_images")
        .select("*")
        .eq("appointment_id", id!)
        .order("created_at");
      if (error) throw error;
      const withUrls = await Promise.all(
        (data ?? []).map(async (img) => {
          const { data: signed } = await storage
            .from("client-images")
            .createSignedUrl(img.file_url, 3600);
          return { ...img, signedUrl: signed?.signedUrl ?? null };
        })
      );
      return withUrls;
    },
    enabled: !!id,
  });


  const { data: serviceConfig } = useQuery({
    queryKey: ["service-config-detail", appointment?.service_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("multi_session, session_count, requires_before_after_photos")
        .eq("id", appointment!.service_id!)
        .single();
      return data;
    },
    enabled: !!appointment?.service_id,
  });

  const isMultiSession = serviceConfig?.multi_session ?? false;
  const totalSessions = serviceConfig?.session_count ?? 0;

  // Session number from dedicated column
  const currentSessionNumber = isMultiSession ? (appointment as any)?.session_number ?? null : null;

  // For multi-session: check if ANY charge already exists for any appointment of same client+service
  const { data: packageChargeExists } = useQuery({
    queryKey: ["package-charge-exists", appointment?.client_id, appointment?.service_id],
    queryFn: async () => {
      // Find all appointments for this client+service
      const { data: relatedAppointments } = await supabase
        .from("appointments")
        .select("id")
        .eq("client_id", appointment!.client_id)
        .eq("service_id", appointment!.service_id!);
      if (!relatedAppointments?.length) return null;
      const ids = relatedAppointments.map((a) => a.id);
      const { data: charge } = await supabase
        .from("charges")
        .select("id, amount, status")
        .in("appointment_id", ids)
        .limit(1)
        .maybeSingle();
      return charge;
    },
    enabled: !!appointment?.client_id && !!appointment?.service_id && isMultiSession,
  });

  // Should we show charge generation? Not if multi-session package with no products sold
  const hasProductsSold = (soldProducts?.length ?? 0) > 0;
  const shouldHideChargeForPackage = isMultiSession && !!packageChargeExists && !existingCharge && !hasProductsSold;

  const { data: feedback } = useQuery({
    queryKey: ["appointment-feedback", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_feedback")
        .select("*")
        .eq("appointment_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Build service name(s) — show all if multi-service, fallback to single
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

  // Check if appointment is overdue (end time has passed and not finalized)
  const isOverdue = useMemo(() => {
    if (!appointment) return false;
    const status = appointment.status;
    if (status === "concluido" || status === "cancelado" || status === "realizado") return false;
    let expectedEnd: Date | null = null;
    if (appointment.end_time) {
      expectedEnd = new Date(appointment.end_time);
    } else {
      const svc = services?.find((s) => s.id === appointment.service_id);
      const durationMin = svc?.duration_minutes ?? 30;
      expectedEnd = new Date(new Date(appointment.start_time).getTime() + durationMin * 60000);
    }
    return expectedEnd ? new Date() > expectedEnd : false;
  }, [appointment, services]);

  const navigateToCharge = () => {
    if (!appointment) return;
    const svc = services?.find((s) => s.id === appointment.service_id);
    // For multi-session packages where the package charge already exists, service price is 0
    const servicePrice = (isMultiSession && !!packageChargeExists) ? 0 : (svc?.price ?? 0);
    const productsTotal = soldProducts?.reduce((sum: number, p: any) => sum + p.unit_price * p.quantity, 0) ?? 0;
    const totalAmount = servicePrice + productsTotal;
    const params = new URLSearchParams({
      client_id: appointment.client_id,
      client_name: (appointment as any).clients?.full_name ?? "",
      appointment_id: id!,
      appointment_date: appointment.start_time,
      amount: String(totalAmount),
    });
    navigate(`/cobrancas/nova?${params.toString()}`);
  };

  const handleConcludeClick = async () => {
    if (feedbackEnabled) {
      setFeedbackOpen(true);
      return;
    }
    if (appointment?.status !== "concluido") {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "concluido" })
        .eq("id", id!);
      if (error) { toast.error("Erro ao concluir."); return; }
    }
    toast.success("Atendimento concluído.");
    queryClient.invalidateQueries({ queryKey: ["appointment-detail", id] });
    if (!shouldHideChargeForPackage) navigateToCharge();
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!appointment) return <p className="text-muted-foreground text-center py-12">Atendimento não encontrado.</p>;
  const responseMap = new Map<string, any>();
  formResponses?.forEach((r) => responseMap.set(r.field_id, r));

  const showAdminActions = isAdmin && !isSpecialist && isOverdue && 
    appointment.status !== "concluido" && appointment.status !== "cancelado" && appointment.status !== "realizado";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-light tracking-wider">Atendimento</h1>
          <p className="text-sm font-medium mt-1">
            {serviceName}
            {isMultiSession && currentSessionNumber != null && totalSessions > 0 && (
              <span className="ml-1 text-muted-foreground font-normal">
                #{currentSessionNumber} de {totalSessions}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Criado em: {fmtDateLong(appointment.created_at)}
          </p>
        </div>

        {/* Admin overdue actions — only when expected end time has passed */}
        {showAdminActions && (
          <Button
            onClick={handleConcludeClick}
            className="gap-2 bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white"
          >
            <CheckCircle2 className="w-4 h-4" /> Concluir Atendimento
          </Button>
        )}

        {/* Cancel button — always visible unless already cancelled/concluded */}
        {appointment.status !== "concluido" && appointment.status !== "cancelado" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={async () => {
              const { error } = await supabase
                .from("appointments")
                .update({ status: "cancelado" })
                .eq("id", id!);
              if (error) { toast.error("Erro ao cancelar."); return; }
              toast.success("Atendimento cancelado.");
              queryClient.invalidateQueries({ queryKey: ["appointment-detail", id] });

              // Fire cancellation webhook
              if (appointment) {
                const svc = services?.find((s) => s.id === appointment.service_id);
                fireBookingWebhook({
                  event: "cancelled",
                  appointment_id: id!,
                  cancellation_token: (appointment as any)?.cancellation_token || undefined,
                  client: {
                    full_name: (appointment.clients as any)?.full_name || "",
                    phone: (appointment.clients as any)?.phone || null,
                    email: null,
                  },
                  client_id: appointment.client_id || null,
                  service_id: appointment.service_id || null,
                  service_name: svc?.name || null,
                  start_time: appointment.start_time,
                  specialist_name: appointment.specialist_name || null,
                  specialist_id: appointment.specialist_id || null,
                });
              }
            }}
          >
            <XCircle className="w-3.5 h-3.5" /> Cancelar
          </Button>
        )}

        {/* Delete button — admin and specialist (own) */}
        {(isAdmin || isSpecialist) && appointment.status === "cancelado" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir atendimento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. Todos os dados associados (cobranças, fichas, fotos, consentimentos) serão apagados permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    const res = await invokeEdgeFunction("delete-appointment", { body: { appointment_id: id! } });
                    if (res?.error) {
                      toast.error(res.error.message || "Erro ao excluir atendimento.");
                      return;
                    }
                    toast.success("Atendimento excluído.");
                    navigate("/agenda");
                  }}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {!isSpecialist && !shouldHideChargeForPackage && (
          existingCharge ? (
            <Button variant="outline" className="gap-2" onClick={() => navigate(`/cobrancas/${existingCharge.id}`)}>
              <Eye className="w-4 h-4" /> Ver Cobrança
            </Button>
          ) : (
            <Button variant="outline" className="gap-2" onClick={navigateToCharge}>
              <Receipt className="w-4 h-4" /> Gerar Cobrança
            </Button>
          )
        )}
        {shouldHideChargeForPackage && (
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/cobrancas/${packageChargeExists!.id}`)}>
            <Eye className="w-4 h-4" /> Ver Cobrança do Pacote
          </Button>
        )}
        <Button onClick={() => navigate(`/atendimentos/${id}/sessao`)} className="gap-2">
          <ClipboardList className="w-4 h-4" /> Sessão de Atendimento
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Cliente" value={(appointment as any).clients?.full_name ?? "—"} />
        <SpecialistCard
          appointmentId={id!}
          specialistName={(appointment as any).specialist_name}
          specialistId={appointment.specialist_id}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ["appointment-detail", id] })}
        />
        <InfoCard label="Serviço" value={serviceName} />
        <InfoCard label="Status">
          <StatusBadge status={appointment.status} />
        </InfoCard>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Data da Visita">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {fmtDateShort(appointment.start_time)}
          </div>
        </InfoCard>
        <InfoCard label="Horário">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {fmtTime(appointment.start_time)}
            {appointment.end_time ? ` — ${fmtTime(appointment.end_time)}` : ""}
          </div>
        </InfoCard>
        <InfoCard label="Duração">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Timer className="w-4 h-4 text-muted-foreground" />
            {appointment.end_time
              ? `${Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / 60000)} min`
              : "—"}
          </div>
        </InfoCard>
        {!(isMultiSession && currentSessionNumber && currentSessionNumber > 1) && (
          <InfoCard label="Valor">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Banknote className="w-4 h-4 text-muted-foreground" />
              {(() => {
                const svc = services?.find((s) => s.id === appointment.service_id);
                return svc?.price != null ? fmtCurrency(svc.price) : "—";
              })()}
              {existingCharge && (
                <StatusBadge status={existingCharge.status} />
              )}
            </div>
          </InfoCard>
        )}
      </div>

      {appointment.notes && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Observações</p>
          <p className="text-sm">{appointment.notes}</p>
        </div>
      )}

      {/* Photos from this appointment */}
      {beforeAfterImages && beforeAfterImages.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Fotos do Atendimento
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(() => {
              const getSetIndex = (caption: string | null): number => {
                if (!caption) return 0;
                if (caption === "before" || caption === "after") return 0;
                const match = caption.match(/^(?:before|after)_(\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
              };
              const sets = new Map<number, { before?: any; after?: any }>();
              beforeAfterImages.forEach((img) => {
                const idx = getSetIndex(img.caption);
                const side = img.caption?.startsWith("before") ? "before" : img.caption?.startsWith("after") ? "after" : null;
                if (!side) return;
                const existing = sets.get(idx) || {};
                (existing as any)[side] = img;
                sets.set(idx, existing);
              });
              return Array.from(sets.entries())
                .sort(([a], [b]) => a - b)
                .map(([idx, set]) => (
                  <div key={idx} className="border border-border rounded-lg p-2 bg-muted/30 space-y-1.5">
                    {sets.size > 1 && (
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Conjunto {idx + 1}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {["before", "after"].map((side) => {
                        const img = (set as any)[side];
                        if (!img?.signedUrl) return (
                          <div key={side} className="aspect-[4/3] rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground uppercase">{side === "before" ? "Antes" : "Depois"}</div>
                        );
                        return (
                          <button key={side} onClick={() => setLightboxUrl(img.signedUrl)} className="aspect-[4/3] rounded overflow-hidden relative cursor-pointer">
                            <img src={img.signedUrl} alt="" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5">
                              {side === "before" ? "Antes" : "Depois"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}

      {formFields && formFields.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Formulário — {serviceName}</h2>
          {formFields.filter((f) => f.field_type !== "photo_upload").map((field) => {
            const response = responseMap.get(field.id);
            return (
              <div key={field.id}>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{field.field_label}</p>
                <p className="text-sm">{response?.value || "—"}</p>
              </div>
            );
          })}
        </div>
      )}

      {soldProducts && soldProducts.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Produtos Vendidos</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Produto</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Qtd</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {soldProducts.map((sp: any) => (
                <TableRow key={sp.id}>
                  <TableCell>{sp.products?.name ?? "—"}</TableCell>
                  <TableCell>{sp.quantity}</TableCell>
                  <TableCell className="text-right">{fmtCurrency(sp.unit_price * sp.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Charge Card — visible for admin/receptionist when status is realizado or concluido */}
      {!isSpecialist && (appointment.status === "realizado" || appointment.status === "concluido") && !shouldHideChargeForPackage && (
        existingCharge ? (
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Cobrança
              </h2>
              <StatusBadge status={existingCharge.status} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="text-sm font-medium">{fmtCurrency(existingCharge.amount)}</p>
              </div>
              {existingCharge.due_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Vencimento</p>
                  <p className="text-sm font-medium">{fmtDateLong(existingCharge.due_date)}</p>
                </div>
              )}
              {existingCharge.paid_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Pago em</p>
                  <p className="text-sm font-medium">{fmtDateLong(existingCharge.paid_at)}</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate(`/cobrancas/${existingCharge.id}`)}>
              <Eye className="w-4 h-4" /> Ver Cobrança
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Cobrança</p>
            <p className="text-sm text-muted-foreground mb-4">Nenhuma cobrança associada a este atendimento.</p>
            <Button variant="outline" className="gap-2" onClick={navigateToCharge}>
              <Receipt className="w-4 h-4" /> Gerar Cobrança
            </Button>
          </div>
        )
      )}

      {/* Multi-session: show info that charge is on the package */}
      {!isSpecialist && (appointment.status === "realizado" || appointment.status === "concluido") && shouldHideChargeForPackage && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Cobrança do Pacote</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Este serviço é de múltiplas sessões. A cobrança já foi gerada na primeira sessão do pacote.
          </p>
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/cobrancas/${packageChargeExists!.id}`)}>
            <Eye className="w-4 h-4" /> Ver Cobrança do Pacote
          </Button>
        </div>
      )}

      {/* Admin actions for "realizado" status — conclude with feedback */}
      {!isSpecialist && appointment.status === "realizado" && (
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Finalização</p>
          <p className="text-sm text-muted-foreground mb-4">
            {shouldHideChargeForPackage
              ? (feedbackEnabled
                ? "O procedimento foi realizado. Conclua o atendimento para coletar feedback."
                : "O procedimento foi realizado. Conclua o atendimento.")
              : (feedbackEnabled
                ? "O procedimento foi realizado. Conclua o atendimento para coletar feedback e gerar cobrança."
                : "O procedimento foi realizado. Conclua o atendimento para gerar cobrança.")}
          </p>
          <Button
            onClick={handleConcludeClick}
            className="gap-2 bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white"
          >
            <CheckCircle2 className="w-4 h-4" /> Finalizar Atendimento
          </Button>
        </div>
      )}

      {/* Feedback Section — display only, hidden for specialists */}
      {!isSpecialist && feedbackEnabled && feedback && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Feedback do Cliente
            </h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < feedback.rating ? "fill-accent text-accent" : "text-muted-foreground/20"}`}
                />
              ))}
              <span className="ml-2 text-sm font-semibold">{feedback.rating}/10</span>
            </div>
            {feedback.comment && <p className="text-sm text-muted-foreground">{feedback.comment}</p>}
          </div>
        </div>
      )}



      {feedbackEnabled && (
      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        appointmentId={id!}
        clientId={appointment.client_id}
        specialistId={appointment.specialist_id}
        clientName={(appointment as any).clients?.full_name ?? "Cliente"}
        allowSkip={appointment.status !== "concluido"}
        onSkip={async () => {
          const { error } = await supabase
            .from("appointments")
            .update({ status: "concluido" })
            .eq("id", id!);
          if (error) { toast.error("Erro ao concluir."); return; }
          toast.success("Atendimento concluído.");
          queryClient.invalidateQueries({ queryKey: ["appointment-detail", id] });
          if (!shouldHideChargeForPackage) navigateToCharge();
        }}
        onSubmitted={async () => {
          if (appointment.status !== "concluido") {
            await supabase
              .from("appointments")
              .update({ status: "concluido" })
              .eq("id", id!);
          }
          queryClient.invalidateQueries({ queryKey: ["appointment-detail", id] });
          queryClient.invalidateQueries({ queryKey: ["appointment-feedback", id] });
          if (!shouldHideChargeForPackage) navigateToCharge();
        }}
      />
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-[5%] cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
    {children ?? <p className="text-sm font-medium">{value}</p>}
  </div>
);

const SpecialistCard = ({
  appointmentId,
  specialistName,
  specialistId,
  onUpdated,
}: {
  appointmentId: string;
  specialistName: string;
  specialistId: string | null;
  onUpdated: () => void;
}) => {
  const [picking, setPicking] = useState(false);
  const { data: specialists } = useSpecialists();

  const assignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ specialist_id: userId })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Especialista definido.");
      setPicking(false);
      onUpdated();
    },
    onError: () => toast.error("Erro ao definir especialista."),
  });

  const hasMissing = !specialistId;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Especialista</p>
      {picking ? (
        <div className="space-y-2">
          {specialists?.map((s) => (
            <button
              key={s.user_id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors border border-border"
              onClick={() => assignMutation.mutate(s.user_id)}
              disabled={assignMutation.isPending}
            >
              {s.full_name || "Sem nome"}
            </button>
          ))}
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setPicking(false)}
          >
            Cancelar
          </button>
        </div>
      ) : hasMissing ? (
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => setPicking(true)}
        >
          Definir
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{specialistName}</p>
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setPicking(true)}
          >
            Alterar
          </button>
        </div>
      )}
    </div>
  );
};

function AppointmentDetailWithBoundary() {
  return (
    <DetailErrorBoundary>
      <AppointmentDetail />
    </DetailErrorBoundary>
  );
}

export default AppointmentDetailWithBoundary;

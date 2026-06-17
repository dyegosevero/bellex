import { useState, useMemo, useEffect, useCallback } from "react";
import { getTimezone } from "@/lib/date";
import { format, parse, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllServices, useSpecialists } from "@/hooks/useAppointmentData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Star, MessageSquare, CheckCircle2, XCircle, Pencil, Eye,
  Clock, Calendar as CalendarIcon, Sparkles, ClipboardList,
  CreditCard, ClipboardCheck, Loader2, Trash2,
} from "lucide-react";
import { fmtCurrency, fmtDateLong, fmtDateOnly, fmtTime } from "@/lib/date";
import { toast } from "sonner";
import FeedbackDialog from "@/components/appointments/FeedbackDialog";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { fireBookingWebhook } from "@/lib/webhook";
import { useFeedbackEnabled } from "@/hooks/useFeedbackEnabled";

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

const TIME_OPTIONS = ["00", "15", "30", "45"];

function getTimezoneOffsetMinutes(timezone: string, dateStr: string): number {
  try {
    const dt = new Date(`${dateStr}T12:00:00Z`);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(dt);
    const get = (type: string) => parseInt(parts.find((part) => part.type === type)?.value || "0", 10);
    const localDate = new Date(Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    ));
    return Math.round((localDate.getTime() - dt.getTime()) / 60000);
  } catch {
    return 0;
  }
}

function getDateTimePartsInTimezone(dateValue: string | Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(dateValue));

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
    minutes: hour * 60 + minute,
  };
}

function getUtcIsoForClinicTime(dateStr: string, totalMinutes: number, timezone: string) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const localMs = new Date(
    `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`,
  ).getTime();
  const offsetMinutes = getTimezoneOffsetMinutes(timezone, dateStr);
  return new Date(localMs - offsetMinutes * 60000).toISOString();
}

interface AppointmentDetailDialogProps {
  appointmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AppointmentDetailDialog({
  appointmentId,
  open,
  onOpenChange,
}: AppointmentDetailDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSpecialist, isReceptionist, isAdmin } = useAuth();
  const canDeleteAppointment = isAdmin || isSpecialist;
  const feedbackEnabled = useFeedbackEnabled();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editData, setEditData] = useState({ service_id: "", specialist_id: "", date: "", start_time: "", end_time: "" });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [notifyClientOnCancel, setNotifyClientOnCancel] = useState(true);
  const [notifyClientOnChange, setNotifyClientOnChange] = useState(true);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [pendingEditData, setPendingEditData] = useState<{ newStart: string; newEnd: string } | null>(null);
  const { data: services } = useAllServices();
  const { data: specialists } = useSpecialists();
  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings-appointment-editor"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_settings").select("timezone").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const clinicTimezone = clinicSettings?.timezone || getTimezone();

  const selectedDayRange = useMemo(() => {
    if (!editData.date) return null;
    const nextDate = format(addDays(parse(editData.date, "yyyy-MM-dd", new Date()), 1), "yyyy-MM-dd");
    return {
      start: getUtcIsoForClinicTime(editData.date, 0, clinicTimezone),
      end: getUtcIsoForClinicTime(nextDate, 0, clinicTimezone),
    };
  }, [editData.date, clinicTimezone]);

  // Fetch existing appointments for the selected date+specialist to detect occupied slots
  const { data: dayAppointments } = useQuery({
    queryKey: ["edit-day-appts", editData.date, editData.specialist_id, appointmentId, clinicTimezone],
    queryFn: async () => {
      if (!editData.date || !editData.specialist_id || !selectedDayRange) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, service_id, services!appointments_service_id_fkey(duration_minutes)")
        .eq("specialist_id", editData.specialist_id)
        .gte("start_time", selectedDayRange.start)
        .lt("start_time", selectedDayRange.end)
        .neq("status", "cancelado")
        .neq("id", appointmentId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!editData.date && !!editData.specialist_id && !!selectedDayRange && editMode,
  });

  // Compute occupied minute ranges from existing appointments using the clinic timezone
  const occupiedRanges = useMemo(() => {
    if (!dayAppointments) return [];

    return dayAppointments
      .map((appointmentItem: any) => {
        const startParts = getDateTimePartsInTimezone(appointmentItem.start_time, clinicTimezone);
        if (startParts.date !== editData.date) return null;

        let endMin: number;
        if (appointmentItem.end_time) {
          endMin = getDateTimePartsInTimezone(appointmentItem.end_time, clinicTimezone).minutes;
        } else {
          const durationMinutes = (appointmentItem.services as any)?.duration_minutes || 30;
          endMin = startParts.minutes + durationMinutes;
        }

        if (endMin <= startParts.minutes) {
          endMin += 24 * 60;
        }

        return { start: startParts.minutes, end: endMin };
      })
      .filter(Boolean) as Array<{ start: number; end: number }>;
  }, [clinicTimezone, dayAppointments, editData.date]);

  // No slot occupation filtering — manual control by attendant
  const isSlotOccupied = useCallback((_slotStartMin: number) => false, []);

  // All hours (7-21) available
  const availableHours = useMemo(() => {
    const hours: number[] = [];
    for (let hour = 7; hour <= 21; hour++) hours.push(hour);
    return hours;
  }, []);

  // All minutes available
  const availableMinutes = useMemo(() => [...TIME_OPTIONS], []);

  const { data: appointment, isLoading } = useQuery({
    queryKey: ["appointment-detail", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients!appointments_client_id_fkey(full_name, phone, email)")
        .eq("id", appointmentId!)
        .single();
      if (error) throw error;
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
      let created_by_name: string | null = null;
      if (data.created_by) {
        const { data: cbProf } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", data.created_by)
          .maybeSingle();
        created_by_name = cbProf?.full_name ?? null;
      }
      return { ...data, specialist_name, specialist_avatar, created_by_name };
    },
    enabled: !!appointmentId && open,
  });

  const { data: appointmentServices } = useQuery({
    queryKey: ["appointment-services", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_services")
        .select("service_id")
        .eq("appointment_id", appointmentId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!appointmentId && open,
  });

  const { data: soldProducts } = useQuery({
    queryKey: ["appointment-products", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_products")
        .select("*, products(name)")
        .eq("appointment_id", appointmentId!);
      if (error) throw error;
      return data;
    },
    enabled: !!appointmentId && open,
  });

  const { data: feedback } = useQuery({
    queryKey: ["appointment-feedback", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_feedback")
        .select("*")
        .eq("appointment_id", appointmentId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!appointmentId && open,
  });

  const { data: existingCharge } = useQuery({
    queryKey: ["appointment-charge", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charges")
        .select("id, status")
        .eq("appointment_id", appointmentId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!appointmentId && open,
  });

  const { data: appointmentConsent } = useQuery({
    queryKey: ["appointment-consent", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_consents")
        .select("id")
        .eq("appointment_id", appointmentId!)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!appointmentId && open,
  });

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

  const serviceObj = useMemo(() => {
    if (!services || !appointment) return null;
    return services.find((s) => s.id === appointment.service_id) ?? null;
  }, [services, appointment]);

  // Session number from dedicated column
  const isMultiSession = (serviceObj as any)?.multi_session ?? false;
  const totalSessions = (serviceObj as any)?.session_count ?? 0;
  const sessionNumber = isMultiSession ? (appointment as any)?.session_number ?? null : null;

  const clientName = (appointment as any)?.clients?.full_name ?? "—";
  const clientPhone = (appointment as any)?.clients?.phone ?? null;

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["appointment-detail", appointmentId] });
    queryClient.invalidateQueries({ queryKey: ["appointment-feedback", appointmentId] });
    queryClient.invalidateQueries({ queryKey: ["appointment-products", appointmentId] });
    queryClient.invalidateQueries({ queryKey: ["appointment-charge", appointmentId] });
    queryClient.invalidateQueries({ queryKey: ["appointment-services", appointmentId] });
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["appointments-list"] });
    queryClient.invalidateQueries({ queryKey: ["agenda-calendar"] });
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
  };

  const doStartSession = async () => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "em_atendimento" })
      .eq("id", appointmentId!);
    if (error) { toast.error("Erro ao iniciar atendimento."); return; }
    toast.success("Atendimento iniciado.");
    invalidateAll();
    onOpenChange(false);
    navigate(`/atendimentos/${appointmentId}/sessao`);
  };

  const handleStartSession = async () => {
    await doStartSession();
  };

  const handleSpecialistComplete = async () => {
    // Deduct stock for products sold in this appointment (SECURITY DEFINER RPC)
    const { error: stockErr } = await supabase.rpc("deduct_appointment_stock", { p_appointment_id: appointmentId! });
    if (stockErr) { toast.error(stockErr.message || "Stock insuficiente — finalização cancelada."); return; }

    const { error } = await supabase
      .from("appointments")
      .update({ status: "realizado" })
      .eq("id", appointmentId!);
    if (error) { toast.error("Erro ao marcar como realizado."); return; }
    toast.success("Atendimento marcado como realizado.");
    invalidateAll();
  };

  const completeAppointmentFlow = async () => {
    if (!appointmentId || !appointment) return;
    await supabase
      .from("appointments")
      .update({ status: "concluido" })
      .eq("id", appointmentId);
    invalidateAll();
    onOpenChange(false);

    if (isMultiSession && sessionNumber != null && sessionNumber > 1) {
      const { data: sessionProducts } = await supabase
        .from("appointment_products")
        .select("quantity, unit_price")
        .eq("appointment_id", appointmentId);
      const sessionProductsTotal = (sessionProducts ?? []).reduce((sum, p) => sum + p.quantity * p.unit_price, 0);
      if (sessionProductsTotal <= 0) {
        toast.success("Atendimento concluído com sucesso.");
        return;
      }
      const params = new URLSearchParams({
        client_id: appointment.client_id,
        client_name: clientName,
        appointment_id: appointmentId,
        appointment_date: appointment.start_time,
        amount: String(sessionProductsTotal),
      });
      navigate(`/cobrancas/nova?${params.toString()}`);
      return;
    }

    const { data: apptProducts } = await supabase
      .from("appointment_products")
      .select("quantity, unit_price")
      .eq("appointment_id", appointmentId);
    const productsTotal = (apptProducts ?? []).reduce((sum, p) => sum + p.quantity * p.unit_price, 0);
    const servicePrice = serviceObj?.price ?? 0;
    const params = new URLSearchParams({
      client_id: appointment.client_id,
      client_name: clientName,
      appointment_id: appointmentId,
      appointment_date: appointment.start_time,
      amount: String(servicePrice + productsTotal),
    });
    navigate(`/cobrancas/nova?${params.toString()}`);
  };

  const handleReceptionistFinalize = () => {
    if (feedbackEnabled) {
      setFeedbackOpen(true);
    } else {
      completeAppointmentFlow();
    }
  };

  const status = appointment?.status;
  const isTerminal = status === "concluido" || status === "cancelado";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden" hideClose onCloseAutoFocus={() => setEditMode(false)}>
          {isLoading || !appointment ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              {/* Header */}
              <DialogHeader className="px-8 pt-8 pb-5 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <DialogTitle className="text-lg font-medium truncate">
                      <button
                        className="hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/clientes/${appointment.client_id}`);
                        }}
                      >
                        {clientName}
                      </button>
                    </DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{fmtDateLong(appointment.start_time)}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-wider w-fit ${STATUS_COLORS[appointment.status] ?? ""}`}
                    >
                      {STATUS_LABELS[appointment.status] ?? appointment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Pencil = toggle inline edit mode */}
                    {!isTerminal && (
                      <Button
                        size="icon"
                        variant={editMode ? "default" : "outline"}
                        className="shrink-0 h-9 w-9 rounded-lg"
                        title="Editar Atendimento"
                        onClick={() => {
                          if (!editMode && appointment) {
                            // Use clinic timezone for consistent date/time extraction
                            const d = new Date(appointment.start_time);
                            const lisbonDate = d.toLocaleDateString("sv-SE", { timeZone: clinicTimezone });
                            const lisbonStart = d.toLocaleTimeString("pt-PT", { timeZone: clinicTimezone, hour: "2-digit", minute: "2-digit", hour12: false });
                            const endDt = appointment.end_time ? new Date(appointment.end_time) : null;
                            const lisbonEnd = endDt ? endDt.toLocaleTimeString("pt-PT", { timeZone: clinicTimezone, hour: "2-digit", minute: "2-digit", hour12: false }) : "";
                            setEditData({
                              service_id: appointment.service_id || "",
                              specialist_id: appointment.specialist_id || "",
                              date: lisbonDate,
                              start_time: lisbonStart,
                              end_time: lisbonEnd,
                            });
                          }
                          setEditMode(!editMode);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {/* Eye = navigate to full detail page */}
                    <Button
                      size="icon"
                      variant="outline"
                      className="shrink-0 h-9 w-9 rounded-lg"
                      title="Ver Atendimento"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/atendimentos/${appointmentId}`);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!isSpecialist && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="shrink-0 h-9 w-9 rounded-lg"
                        title={existingCharge ? "Ver Cobrança" : "Gerar Cobrança"}
                        onClick={() => {
                          onOpenChange(false);
                          if (existingCharge) {
                            navigate(`/cobrancas/${existingCharge.id}`);
                          } else {
                            navigate(`/cobrancas/nova?appointment_id=${appointmentId}&client_id=${appointment?.client_id}`);
                          }
                        }}
                      >
                        <CreditCard className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      className="shrink-0 h-9 w-9 rounded-lg"
                      title="Sessão de Atendimento"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/atendimentos/${appointmentId}/sessao`);
                      }}
                    >
                      <ClipboardCheck className="w-4 h-4" />
                    </Button>
                    {canDeleteAppointment && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="shrink-0 h-9 w-9 rounded-lg bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        title="Excluir Atendimento"
                        onClick={() => setDeleteConfirmOpen(true)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh]">
                <div className="px-8 py-6 space-y-5">
                  {/* Edit Mode */}
                  {editMode ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Serviço</Label>
                        <Select value={editData.service_id} onValueChange={(v) => {
                          const svc = services?.find(s => s.id === v);
                          if (svc?.duration_minutes && editData.start_time) {
                            const [h, m] = editData.start_time.split(":").map(Number);
                            const endMin = h * 60 + m + svc.duration_minutes;
                            const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
                            setEditData({ ...editData, service_id: v, end_time: endTime });
                          } else {
                            setEditData({ ...editData, service_id: v });
                          }
                        }}>
                          <SelectTrigger><SelectValue placeholder="Selecionar serviço" /></SelectTrigger>
                          <SelectContent>
                            {services?.filter(s => s.active).map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Especialista</Label>
                        <Select value={editData.specialist_id} onValueChange={(v) => setEditData({ ...editData, specialist_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecionar especialista" /></SelectTrigger>
                          <SelectContent>
                            {specialists?.map(s => (
                              <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editData.date
                                ? format(parse(editData.date, "yyyy-MM-dd", new Date()), "d 'de' MMMM 'de' yyyy", { locale: pt })
                                : "Selecionar data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={editData.date ? parse(editData.date, "yyyy-MM-dd", new Date()) : undefined}
                              onSelect={(d) => {
                                if (d) setEditData({ ...editData, date: format(d, "yyyy-MM-dd") });
                              }}
                              locale={pt}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Horas</Label>
                          <Select
                            value={editData.start_time ? editData.start_time.split(":")[0] : ""}
                            onValueChange={(h) => {
                              // When hour changes, pick the first available minute
                              const firstMin = ["00", "15", "30", "45"].find(m => !isSlotOccupied(parseInt(h) * 60 + parseInt(m))) || "00";
                              const newStart = `${h}:${firstMin}`;
                              const svc = services?.find(s => s.id === editData.service_id);
                              if (svc?.duration_minutes) {
                                const totalMin = parseInt(h) * 60 + parseInt(firstMin) + svc.duration_minutes;
                                const endTime = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
                                setEditData({ ...editData, start_time: newStart, end_time: endTime });
                              } else {
                                setEditData({ ...editData, start_time: newStart });
                              }
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                            <SelectContent>
                              {availableHours.map((h) => (
                                <SelectItem key={h} value={String(h).padStart(2, "0")}>{String(h).padStart(2, "0")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Minutos</Label>
                          <Select
                            value={editData.start_time ? editData.start_time.split(":")[1] : ""}
                            onValueChange={(m) => {
                              const hrs = editData.start_time.split(":")[0] || "08";
                              const newStart = `${hrs}:${m}`;
                              const svc = services?.find(s => s.id === editData.service_id);
                              if (svc?.duration_minutes) {
                                const totalMin = parseInt(hrs) * 60 + parseInt(m) + svc.duration_minutes;
                                const endTime = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
                                setEditData({ ...editData, start_time: newStart, end_time: endTime });
                              } else {
                                setEditData({ ...editData, start_time: newStart });
                              }
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                            <SelectContent>
                              {availableMinutes.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fim</Label>
                          <Input
                            value={editData.end_time || ""}
                            readOnly
                            className="bg-muted/50"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={editSaving}
                          onClick={() => {
                            const dateStr = editData.date;
                            const [startH, startM] = editData.start_time.split(":").map(Number);
                            const newStart = getUtcIsoForClinicTime(dateStr, startH * 60 + startM, clinicTimezone);
                            const newEnd = editData.end_time
                              ? (() => {
                                  const [endH, endM] = editData.end_time.split(":").map(Number);
                                  return getUtcIsoForClinicTime(dateStr, endH * 60 + endM, clinicTimezone);
                                })()
                              : null;
                            setPendingEditData({ newStart, newEnd: newEnd || "" });
                            setNotifyClientOnChange(true);
                            setEditConfirmOpen(true);
                          }}
                        >
                          {editSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                  /* Info Grid (read-only) */
                  <>
                    <div className="space-y-3">
                      {/* Row 1: Data, Horário, Especialista */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3.5">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Data</p>
                            <p className="text-sm font-medium">{fmtDateOnly(appointment.start_time)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3.5">
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Horário</p>
                            <p className="text-sm font-medium">
                              {fmtTime(appointment.start_time)}
                              {appointment.end_time && ` – ${fmtTime(appointment.end_time)}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3.5">
                          <Avatar className="w-6 h-6 shrink-0">
                            <AvatarImage src={appointment.specialist_avatar || undefined} />
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                              {getInitials(appointment.specialist_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Especialista</p>
                            <p className="text-sm font-medium truncate">{appointment.specialist_name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Serviço, Valor */}
                      <div className="grid grid-cols-[1fr_0.4fr] gap-3">
                        <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3.5">
                          <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Serviço</p>
                            <p className="text-sm font-medium truncate">
                              {serviceName}
                              {isMultiSession && sessionNumber != null && totalSessions > 0 && (
                                <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                                  #{sessionNumber} de {totalSessions}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {serviceObj?.price != null && (
                          <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3.5">
                            <span className="text-muted-foreground text-sm font-medium shrink-0">€</span>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Valor</p>
                              <p className="text-sm font-medium">
                                {isMultiSession && sessionNumber != null && sessionNumber > 1
                                  ? fmtCurrency(0)
                                  : fmtCurrency(serviceObj.price)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Row 3: Observações */}
                      {appointment.notes && (
                        <div className="bg-muted/50 rounded-xl px-4 py-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Observações</p>
                          <p className="text-sm text-foreground">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  </>
                  )}

                  {/* Created at metadata */}
                  {appointment.created_at && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      Agendamento criado {appointment.created_by_name ? `por ${appointment.created_by_name}` : "pelo cliente"} em {fmtDateLong(appointment.created_at)}
                    </p>
                  )}

                  {/* Products */}
                  {soldProducts && soldProducts.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Produtos</p>
                      <div className="space-y-1.5">
                        {soldProducts.map((sp: any) => (
                          <div key={sp.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2">
                            <span>{sp.products?.name ?? "—"} × {sp.quantity}</span>
                            <span className="font-medium">{fmtCurrency(sp.unit_price * sp.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {feedback && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Feedback
                      </p>
                      <div className="bg-muted/50 rounded-lg px-4 py-3 space-y-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 10 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < feedback.rating ? "fill-primary text-primary" : "text-muted-foreground/20"}`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-semibold">{feedback.rating}/10</span>
                        </div>
                        {feedback.comment && (
                          <p className="text-sm text-muted-foreground">{feedback.comment}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2.5 pt-2">

                    <div className="flex gap-2.5">
                      {/* Agendado → Iniciar Atendimento */}
                      {status === "agendado" && (
                        <Button size="sm" onClick={handleStartSession} className="flex-1 gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Iniciar Atendimento
                        </Button>
                      )}

                      {/* Em atendimento → Atendimento Realizado */}
                      {status === "em_atendimento" && (isSpecialist || isAdmin) && (
                        <Button size="sm" onClick={handleSpecialistComplete} className="flex-1 gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Atendimento Realizado
                        </Button>
                      )}

                      {/* Realizado → Concluir Atendimento (recepção) */}
                      {status === "realizado" && (isReceptionist || isAdmin) && (
                        <Button size="sm" onClick={handleReceptionistFinalize} className="flex-1 gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Concluir Atendimento
                        </Button>
                      )}

                      {/* Cancelar — only agendado or em_atendimento */}
                      {(status === "agendado" || status === "em_atendimento") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setCancelConfirmOpen(true)}
                          className="flex-1 gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback dialog for receptionist "Finalizar" flow */}
      {appointmentId && appointment && feedbackEnabled && (
        <FeedbackDialog
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          appointmentId={appointmentId}
          clientId={appointment.client_id}
          specialistId={appointment.specialist_id}
          clientName={clientName}
          allowSkip={false}
          onSubmitted={completeAppointmentFlow}
        />
      )}

      <AlertDialog open={cancelConfirmOpen} onOpenChange={(o) => { setCancelConfirmOpen(o); if (!o) setNotifyClientOnCancel(true); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este atendimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 px-1">
            <Checkbox id="notify-cancel" checked={notifyClientOnCancel} onCheckedChange={(v) => setNotifyClientOnCancel(!!v)} />
            <label htmlFor="notify-cancel" className="text-sm cursor-pointer select-none">Notificar cliente</label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const { data: updated, error } = await supabase
                  .from("appointments")
                  .update({ status: "cancelado" })
                  .eq("id", appointmentId!)
                  .select("id");
                if (error) { toast.error("Erro ao cancelar."); return; }
                if (!updated || updated.length === 0) { toast.error("Não foi possível cancelar — sem permissão."); return; }
                toast.success("Atendimento cancelado.");
                invalidateAll();
                setCancelConfirmOpen(false);
                onOpenChange(false);

                // Always fire webhook — n8n decides whether to notify
                if (appointment) {
                  const svc = services?.find((s: any) => s.id === appointment.service_id);
                  fireBookingWebhook({
                    event: "cancelled",
                    appointment_id: appointmentId!,
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
              }}
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir remove totalmente este atendimento{existingCharge || appointmentConsent ? " e os dados vinculados" : ""}. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault();
                if (!appointmentId) {
                  toast.error("Atendimento inválido.");
                  return;
                }
                setDeleting(true);
                const { error } = await invokeEdgeFunction("delete-appointment", {
                  body: { appointment_id: appointmentId },
                });
                setDeleting(false);
                if (error) { toast.error(error.message || "Erro ao excluir atendimento."); return; }
                toast.success("Atendimento excluído.");
                setDeleteConfirmOpen(false);
                onOpenChange(false);
                invalidateAll();
              }}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit confirmation dialog with notify checkbox */}
      <AlertDialog open={editConfirmOpen} onOpenChange={(o) => { setEditConfirmOpen(o); if (!o) setNotifyClientOnChange(true); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 px-1">
            <Checkbox id="notify-change" checked={notifyClientOnChange} onCheckedChange={(v) => setNotifyClientOnChange(!!v)} />
            <label htmlFor="notify-change" className="text-sm cursor-pointer select-none">Notificar cliente</label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingEditData) return;
                setEditSaving(true);
                try {
                  const { error } = await supabase
                    .from("appointments")
                    .update({
                      service_id: editData.service_id || null,
                      specialist_id: editData.specialist_id || null,
                      start_time: pendingEditData.newStart,
                      end_time: pendingEditData.newEnd || null,
                    })
                    .eq("id", appointmentId!);
                  if (error) throw error;

                  if (editData.service_id) {
                    await supabase.from("appointment_services").delete().eq("appointment_id", appointmentId!);
                    await supabase.from("appointment_services").insert({
                      appointment_id: appointmentId!,
                      service_id: editData.service_id,
                    } as any);
                  }

                  toast.success("Atendimento atualizado!");
                  invalidateAll();
                  setEditMode(false);
                  setEditConfirmOpen(false);

                  // Always fire webhook — n8n decides whether to notify
                  if (appointment) {
                    const svc = services?.find((s: any) => s.id === (editData.service_id || appointment.service_id));
                    fireBookingWebhook({
                      event: "changed",
                      appointment_id: appointmentId!,
                      notify_client: notifyClientOnChange,
                      cancellation_token: appointment.cancellation_token || undefined,
                      client: {
                        full_name: (appointment.clients as any)?.full_name || "",
                        phone: (appointment.clients as any)?.phone || null,
                        email: (appointment.clients as any)?.email || null,
                      },
                      client_id: appointment.client_id || null,
                      service_id: editData.service_id || appointment.service_id || null,
                      service_name: svc?.name || null,
                      start_time: pendingEditData.newStart,
                      specialist_name: appointment.specialist_name || null,
                      specialist_id: appointment.specialist_id || null,
                    });
                  }
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setEditSaving(false);
                }
              }}
            >
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}

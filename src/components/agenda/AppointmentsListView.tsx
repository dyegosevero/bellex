import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServices, useSpecialists } from "@/hooks/useAppointmentData";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, CalendarClock, Star, DollarSign, AlertTriangle,
  Trash2, Loader2,
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { pt } from "date-fns/locale";
import { fmtDateShort, fmtTime, withTimezoneOffset } from "@/lib/date";
import { toast } from "sonner";
import AppointmentDetailDialog from "./AppointmentDetailDialog";
import FeedbackDialog from "@/components/appointments/FeedbackDialog";

import { invokeEdgeFunction } from "@/lib/edge-functions";

const PAGE_SIZE = 20;

function toTimezoneBoundary(date: Date, time: string) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return withTimezoneOffset(`${year}-${month}-${day}T${time}`);
}

type DateFilter = "today" | "week" | "custom";


interface AppointmentsListViewProps {
  specialistId?: string;
  selectedDate?: string;
}

export function AppointmentsListView({ specialistId, selectedDate }: AppointmentsListViewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState<DateFilter>(selectedDate ? "custom" : "today");
  const [customDate, setCustomDate] = useState<Date>(selectedDate ? new Date(selectedDate + "T12:00:00") : new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(selectedDate ? new Date(selectedDate + "T12:00:00") : new Date());
  const [specialistFilter, setSpecialistFilter] = useState(specialistId && specialistId !== "all" ? specialistId : "all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sync specialist filter when parent prop changes
  useEffect(() => {
    if (specialistId) {
      setSpecialistFilter(specialistId !== "all" ? specialistId : "all");
      setPage(1);
    }
  }, [specialistId]);

  // Sync date when parent changes it via toolbar navigation
  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate + "T12:00:00");
      setCustomDate(d);
      setCustomEndDate(d);
      setDateFilter("custom");
      setPage(1);
    }
  }, [selectedDate]);

  const [page, setPage] = useState(1);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Cancel confirmation
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [notifyClientOnCancel, setNotifyClientOnCancel] = useState(true);
  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback dialog
  const [feedbackTarget, setFeedbackTarget] = useState<{ id: string; clientId: string; specialistId: string | null; clientName: string } | null>(null);

  const { data: services } = useServices();
  const { data: specialists } = useSpecialists();

  const dateRange = useMemo(() => {
    const now = new Date();
    if (dateFilter === "today") {
      return {
        start: toTimezoneBoundary(now, "00:00:00"),
        end: toTimezoneBoundary(now, "23:59:59"),
      };
    }
    if (dateFilter === "week") {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return {
        start: toTimezoneBoundary(start, "00:00:00"),
        end: toTimezoneBoundary(end, "23:59:59"),
      };
    }
    return {
      start: toTimezoneBoundary(customDate, "00:00:00"),
      end: toTimezoneBoundary(customEndDate, "23:59:59"),
    };
  }, [dateFilter, customDate, customEndDate]);

  const { data, isLoading } = useQuery({
    queryKey: ["appointments-list", dateRange.start, dateRange.end, specialistFilter, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select("id, start_time, end_time, status, notes, service_id, client_id, specialist_id, clients!appointments_client_id_fkey(full_name, email), services!appointments_service_id_fkey(name, price)", { count: "exact" })
        .gte("start_time", dateRange.start)
        .lte("start_time", dateRange.end)
        .order("start_time", { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (specialistFilter !== "all") query = query.eq("specialist_id", specialistFilter);

      const { data, error, count } = await query;
      if (error) throw error;

      const specialistIds = [...new Set((data ?? []).map((a: any) => a.specialist_id).filter(Boolean))];
      let specialistMap: Record<string, string> = {};
      if (specialistIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", specialistIds);
        profiles?.forEach((p) => { specialistMap[p.user_id] = p.full_name; });
      }

      const rows = (data ?? []).map((a: any) => ({
        ...a,
        specialist_name: a.specialist_id ? specialistMap[a.specialist_id] ?? "—" : "—",
      }));

      return { rows, total: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: ["appointments-list"] });
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Deduct stock when finalizing appointment
    if (newStatus === "realizado") {
      const { error: stockErr } = await supabase.rpc("deduct_appointment_stock", { p_appointment_id: id });
      if (stockErr) { toast.error(stockErr.message || "Stock insuficiente — finalização cancelada."); return; }
    }

    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) { toast.error("Erro ao atualizar status."); return; }
    toast.success(`Status atualizado para ${newStatus}.`);
    invalidateList();
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    await handleStatusChange(cancelTarget, "cancelado");

    // Always fire webhook — n8n decides whether to notify
    const row = data?.rows?.find((r: any) => r.id === cancelTarget);
    if (row) {
      const { fireBookingWebhook } = await import("@/lib/webhook");
      fireBookingWebhook({
        event: "cancelled",
        appointment_id: cancelTarget,
        notify_client: notifyClientOnCancel,
        cancellation_token: row.cancellation_token || undefined,
        client: {
          full_name: (row.clients as any)?.full_name || "",
          phone: (row.clients as any)?.phone || null,
          email: (row.clients as any)?.email || null,
        },
        client_id: row.client_id || null,
        service_id: row.service_id || null,
        service_name: (row.services as any)?.name || null,
        start_time: row.start_time,
        specialist_name: row.specialist_name || null,
        specialist_id: row.specialist_id || null,
      });
    }

    setCancelTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await invokeEdgeFunction("delete-appointment", { body: { appointment_id: deleteTarget } });
      if (res?.error) throw new Error(res.error.message || String(res.error));

      toast.success("Atendimento excluído.");
      invalidateList();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleGenerateCharge = async (a: any) => {
    // Fetch products total for this appointment
    const { data: apptProducts } = await supabase
      .from("appointment_products")
      .select("quantity, unit_price")
      .eq("appointment_id", a.id);
    const productsTotal = (apptProducts ?? []).reduce((sum: number, p: any) => sum + p.quantity * p.unit_price, 0);
    const servicePrice = a.services?.price ?? 0;
    const params = new URLSearchParams({
      client_id: a.client_id,
      client_name: a.clients?.full_name ?? "",
      appointment_id: a.id,
      appointment_date: a.start_time,
      amount: String(servicePrice + productsTotal),
    });
    navigate(`/cobrancas/nova?${params.toString()}`);
  };

  // Get available status actions based on current status
  const getStatusActions = (status: string) => {
    switch (status) {
      case "agendado":
        return [
          { label: "Iniciar Atendimento", status: "em_atendimento", icon: CalendarClock },
        ];
      case "em_atendimento":
        return [
          { label: "Realizado", status: "realizado", icon: CheckCircle2 },
        ];
      case "realizado":
        return [
          { label: "Concluir", status: "concluido", icon: CheckCircle2 },
        ];
      default:
        return [];
    }
  };

  const canCancel = (status: string) => !["cancelado", "realizado", "concluido"].includes(status);
  const canReschedule = (status: string) => ["agendado", "em_atendimento"].includes(status);

  return (
    <div className="bg-card border border-border border-t-0 rounded-b-lg">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
        <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v as DateFilter); setPage(1); }}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {dateFilter === "custom" && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {format(customDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customDate} onSelect={(d) => { if (d) { setCustomDate(d); if (d > customEndDate) setCustomEndDate(d); setPage(1); } }} locale={pt} />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {format(customEndDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customEndDate} onSelect={(d) => { if (d) { setCustomEndDate(d); if (d < customDate) setCustomDate(d); setPage(1); } }} locale={pt} />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Select value={specialistFilter} onValueChange={(v) => { setSpecialistFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos especialistas</SelectItem>
            {(specialists ?? []).map((s) => (
              <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="em_atendimento">Em atendimento</SelectItem>
            <SelectItem value="realizado">Realizado</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">
          {data?.total ?? 0} atendimento{(data?.total ?? 0) !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[10px] uppercase tracking-wider">Horário</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider">Cliente</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider">Serviço</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider">Especialista</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>)}</TableRow>
            ))
          ) : data?.rows && data.rows.length > 0 ? (
            data.rows.map((a: any) => {
              const statusActions = getStatusActions(a.status);
              return (
                <TableRow key={a.id} className="hover:bg-muted/50">
                  <TableCell
                    className="text-sm whitespace-nowrap cursor-pointer"
                    onClick={() => { setSelectedAppointmentId(a.id); setDetailOpen(true); }}
                  >
                    <div>{fmtDateShort(a.start_time)}</div>
                    <div className="text-xs text-muted-foreground">{fmtTime(a.start_time)}</div>
                  </TableCell>
                  <TableCell
                    className="font-medium cursor-pointer"
                    onClick={() => { setSelectedAppointmentId(a.id); setDetailOpen(true); }}
                  >
                    {a.clients?.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.services?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.specialist_name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {statusActions.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={() => handleStatusChange(a.id, action.status)}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {action.label}
                          </Button>
                        );
                      })}
                      {canCancel(a.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => setCancelTarget(a.id)}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(a.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                Nenhum atendimento encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" className="h-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) { setCancelTarget(null); setNotifyClientOnCancel(true); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Cancelar Atendimento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este atendimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 px-1">
            <Checkbox id="notify-cancel-list" checked={notifyClientOnCancel} onCheckedChange={(v) => setNotifyClientOnCancel(!!v)} />
            <label htmlFor="notify-cancel-list" className="text-sm cursor-pointer select-none">Notificar cliente</label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar Atendimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o && !isDeleting) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Excluir Atendimento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este atendimento? Todos os dados associados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...</> : "Excluir Definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail dialog */}
      <AppointmentDetailDialog
        appointmentId={selectedAppointmentId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Feedback dialog */}
      {feedbackTarget && (
        <FeedbackDialog
          open={!!feedbackTarget}
          onOpenChange={(o) => { if (!o) setFeedbackTarget(null); }}
          appointmentId={feedbackTarget.id}
          clientId={feedbackTarget.clientId}
          specialistId={feedbackTarget.specialistId}
          clientName={feedbackTarget.clientName}
          allowSkip={false}
          onSubmitted={() => {
            setFeedbackTarget(null);
            invalidateList();
            toast.success("Feedback registado com sucesso.");
          }}
        />
      )}
    </div>
  );
}

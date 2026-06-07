import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2, RefreshCw, Loader2, Clock, Check, X, Minus, Mail, MessageSquare, Phone, ArrowUpDown, Search, Ban, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Input } from "@/components/ui/input";

type SortField = "client_name" | "service_name" | "start_time" | "send_at" | "created_at" | "status";
type SortDir = "asc" | "desc";
type DialogAction = "cancel" | "delete" | null;

const PAGE_SIZE = 50;

interface ReminderHistoryRecord {
  id: string;
  appointment_id: string;
  client_id: string | null;
  client_name: string | null;
  service_name: string | null;
  specialist_name: string | null;
  start_time: string | null;
  send_at: string | null;
  channels: { email?: boolean; whatsapp?: boolean; sms?: boolean } | null;
  status: string;
  status_detail: string | null;
  sms_status: string | null;
  whatsapp_status: string | null;
  email_status: string | null;
  email_external_id: string | null;
  whatsapp_external_id: string | null;
  sms_external_id: string | null;
  created_at: string;
}

const LIFECYCLE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  dispatched: { label: "Despachado", variant: "default" },
  cancelled: { label: "Cancelado", variant: "secondary" },
  deleted: { label: "Removido", variant: "secondary" },
  dispatch_error: { label: "Erro Despacho", variant: "destructive" },
};

function ChannelStatusIcon({ status, enabled }: { status: string | null; enabled: boolean }) {
  if (!enabled) return <Minus className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />;
  if (!status) return <Clock className="w-3.5 h-3.5 text-muted-foreground/50 mx-auto" />;
  if (status === "sent") return <Check className="w-3.5 h-3.5 text-green-600 mx-auto" />;
  if (status === "failed") return <X className="w-3.5 h-3.5 text-destructive mx-auto" />;
  return <Clock className="w-3.5 h-3.5 text-amber-500 mx-auto" />;
}


export default function ReminderLogs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionTarget, setActionTarget] = useState<ReminderHistoryRecord | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [acting, setActing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reminder-history", statusFilter, searchTerm, sortField, sortDir, page],
    queryFn: async () => {
      let countQuery = supabase
        .from("reminder_history")
        .select("id", { count: "exact", head: true });

      let query = supabase
        .from("reminder_history")
        .select("*")
        .order(sortField === "created_at" ? "created_at" : sortField, { ascending: sortDir === "asc" })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
        countQuery = countQuery.eq("status", statusFilter);
      }

      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(`client_name.ilike.${term},service_name.ilike.${term}`);
        countQuery = countQuery.or(`client_name.ilike.${term},service_name.ilike.${term}`);
      }

      const [{ data: rows, error: rowsErr }, { count, error: countErr }] = await Promise.all([query, countQuery]);
      if (rowsErr) throw rowsErr;
      if (countErr) throw countErr;

      return {
        rows: (rows ?? []) as unknown as ReminderHistoryRecord[],
        total: count ?? 0,
      };
    },
  });

  const history = data?.rows ?? [];
  const totalRows = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const toggleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDir("desc");
      return field;
    });
    setPage(0);
  }, []);

  const openDialog = (record: ReminderHistoryRecord, action: "cancel" | "delete") => {
    setActionTarget(record);
    setDialogAction(action);
  };

  const closeDialog = () => {
    setActionTarget(null);
    setDialogAction(null);
  };

  const handleConfirm = useCallback(async () => {
    if (!actionTarget || !dialogAction) return;
    setActing(true);
    try {
      if (dialogAction === "cancel") {
        const { error } = await supabase
          .from("reminder_history")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", actionTarget.id);
        if (error) throw error;
        toast.success("Lembrete cancelado.");
      } else {
        const { error } = await supabase
          .from("reminder_history")
          .delete()
          .eq("id", actionTarget.id);
        if (error) throw error;
        toast.success("Registro excluído.");
      }
      queryClient.invalidateQueries({ queryKey: ["reminder-history"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar.");
    } finally {
      setActing(false);
      closeDialog();
    }
  }, [actionTarget, dialogAction, queryClient]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: pt });
    } catch {
      return dateStr;
    }
  };

  const buildExternalIdTooltip = (r: ReminderHistoryRecord) => {
    const parts: string[] = [];
    if (r.email_external_id) parts.push(`Email: ${r.email_external_id}`);
    if (r.whatsapp_external_id) parts.push(`WhatsApp: ${r.whatsapp_external_id}`);
    if (r.sms_external_id) parts.push(`SMS: ${r.sms_external_id}`);
    return parts.length > 0 ? parts.join("\n") : null;
  };

  const SortableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-foreground" : "text-muted-foreground/40"}`} />
      </div>
    </TableHead>
  );

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(0);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-light tracking-wider flex items-center gap-2">
            <Clock className="w-5 h-5" /> REGISTROS DE LEMBRETES
          </h1>
          <p className="text-sm text-muted-foreground">
            Lembretes enviados e pendentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome ou serviço…"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9 w-[220px]"
            />
          </div>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="dispatched">Despachado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="deleted">Removido</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">Erro ao carregar lembretes.</p>
            <p className="text-xs mt-1">{(error as Error).message}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum registo no histórico.</p>
          </div>
        ) : (
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead field="created_at">Criação</SortableHead>
                  <TableHead>Marcação</TableHead>
                  <SortableHead field="client_name">Cliente</SortableHead>
                  <SortableHead field="service_name">Serviço</SortableHead>
                  <SortableHead field="start_time">Data Marcação</SortableHead>
                  <SortableHead field="send_at">Envio Agendado</SortableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> WA
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> SMS
                    </div>
                  </TableHead>
                  <SortableHead field="status">Ciclo</SortableHead>
                  <TableHead>Detalhe</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((r) => {
                  const lifecycle = LIFECYCLE_MAP[r.status] || { label: r.status, variant: "outline" as const };
                  const ch = r.channels || {};
                  const extIds = buildExternalIdTooltip(r);

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                      <TableCell className="text-xs font-mono max-w-[120px] truncate">
                        <button
                          className="text-primary underline hover:text-primary/80 transition-colors"
                          onClick={() => navigate(`/atendimentos/${r.appointment_id}`)}
                        >
                          {r.appointment_id.substring(0, 8)}…
                        </button>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {r.client_id ? (
                          <button
                            className="text-primary underline hover:text-primary/80 transition-colors"
                            onClick={() => navigate(`/clientes/${r.client_id}`)}
                          >
                            {r.client_name || "—"}
                          </button>
                        ) : (
                          r.client_name || "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.service_name || "—"}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.start_time)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.send_at)}</TableCell>

                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><ChannelStatusIcon status={r.email_status} enabled={!!ch.email} /></span>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            {!ch.email ? "Não ativado" : r.email_status ? `Email: ${r.email_status}` : "Aguardando"}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><ChannelStatusIcon status={r.whatsapp_status} enabled={!!ch.whatsapp} /></span>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            {!ch.whatsapp ? "Não ativado" : r.whatsapp_status ? `WhatsApp: ${r.whatsapp_status}` : "Aguardando"}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><ChannelStatusIcon status={r.sms_status} enabled={!!ch.sms} /></span>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            {!ch.sms ? "Não ativado" : r.sms_status ? `SMS: ${r.sms_status}` : "Aguardando"}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        {extIds ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Badge variant={lifecycle.variant} className="text-xs cursor-help">
                                  {lifecycle.label}
                                </Badge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="whitespace-pre-line text-xs max-w-xs">
                              {extIds}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge variant={lifecycle.variant} className="text-xs">
                            {lifecycle.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {extIds ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {r.status_detail || "—"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="whitespace-pre-line text-xs max-w-xs">
                              {extIds}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span>{r.status_detail || "—"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === "pending" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-700"
                                  onClick={() => openDialog(r, "cancel")}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Cancelar envio</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => openDialog(r, "delete")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Excluir registro</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {totalRows} registro{totalRows !== 1 ? "s" : ""} — Página {page + 1} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!actionTarget && !!dialogAction} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === "cancel" ? "Cancelar lembrete?" : "Excluir registro?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === "cancel" ? (
                <>O lembrete para <strong>{actionTarget?.client_name}</strong> será cancelado e o envio não será efetuado.</>
              ) : (
                <>O registro de lembrete para <strong>{actionTarget?.client_name}</strong> será permanentemente excluído.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={acting}
              className={dialogAction === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {acting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : dialogAction === "cancel" ? <Ban className="w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {dialogAction === "cancel" ? "Cancelar envio" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

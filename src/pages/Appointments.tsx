import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlurFade } from "@/components/ui/blur-fade";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServices } from "@/hooks/useAppointmentData";
import { AgendaCalendar } from "@/components/appointments/AgendaCalendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, Plus, Calendar, List } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { fmtDateShort } from "@/lib/date";

const PAGE_SIZE = 20;


const Appointments = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<string>("calendar");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  const { data: services } = useServices();

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", debouncedSearch, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select("id, start_time, status, notes, service_id, client_id, specialist_id, clients(full_name)", { count: "exact" })
        .order("start_time", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (statusFilter !== "all") query = query.eq("status", statusFilter);

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
    enabled: view === "list",
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId || !services) return "—";
    return services.find((s) => s.id === serviceId)?.name ?? "—";
  };

  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wider">Atendimentos</h1>
            <p className="text-sm text-muted-foreground mt-1">Visualize e gerencie os atendimentos</p>
          </div>
          <Button onClick={() => navigate("/atendimentos/novo")}>
            <Plus className="w-4 h-4 mr-2" /> Novo Agendamento
          </Button>
        </div>
      </BlurFade>

      <BlurFade delay={0.15}>
      <Tabs value={view} onValueChange={setView} className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1.5"><Calendar className="w-3.5 h-3.5" /> Calendário</TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5"><List className="w-3.5 h-3.5" /> Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar"><AgendaCalendar /></TabsContent>

        <TabsContent value="list">
          <div className="flex gap-3 mb-6">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10 h-10" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="agendado">Agendado</SelectItem>
                <SelectItem value="em_atendimento">Em atendimento</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Cliente</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Serviço</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Especialista</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>)}</TableRow>
                  ))
                ) : data?.rows && data.rows.length > 0 ? (
                  data.rows.map((a: any) => (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/atendimentos/${a.id}`)}>
                      <TableCell className="text-sm">{fmtDateShort(a.start_time)}</TableCell>
                      <TableCell className="font-medium">{a.clients?.full_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{getServiceName(a.service_id)}</TableCell>
                      <TableCell className="text-muted-foreground">{a.specialist_name ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                      Nenhum atendimento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </BlurFade>
    </div>
  );
};

export default Appointments;

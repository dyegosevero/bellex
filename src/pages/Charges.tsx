import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CreditCard, Plus, Search, ChevronLeft, ChevronRight, Eye, Pencil,
} from "lucide-react";
import { DateRangeFilter, type DateRangeValue } from "@/components/ui/date-range-filter";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtCurrency, fmtDate } from "@/lib/date";


const PAGE_SIZE = 20;

const Charges = () => {
  const navigate = useNavigate();
  const { isAdmin, isReceptionist } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["charges", debouncedSearch, statusFilter, dateRange, page],
    queryFn: async () => {
      let query = supabase.from("charges").select("*, clients(full_name)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (dateRange) query = query.gte("created_at", dateRange.from.toISOString()).lte("created_at", dateRange.to.toISOString());
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const canMarkPaid = isAdmin || isReceptionist;

  const statusMutation = useMutation({
    mutationFn: async ({ chargeId, newStatus }: { chargeId: string; newStatus: string }) => {
      const update: Record<string, unknown> = { status: newStatus };
      if (newStatus === "pago") update.paid_at = new Date().toISOString();
      const { error } = await supabase.from("charges").update(update).eq("id", chargeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges"] });
      toast({ title: "Status atualizado" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between mb-8">
          <PageHeader
            icon={<CreditCard className="w-5 h-5" />}
            title="Cobranças"
            subtitle={data?.total ? `${data.total} cobranças` : "Gestão de cobranças e pagamentos"}
            className="mb-0"
          />
          <Button onClick={() => navigate("/cobrancas/nova")}><Plus className="w-4 h-4 mr-2" /> Nova Cobrança</Button>
        </div>
      </BlurFade>

      <div className="mb-4">
        <DateRangeFilter value={dateRange} onChange={(v) => { setDateRange(v); setPage(1); }} />
      </div>
      <div className="flex gap-3 mb-6">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BlurFade delay={0.15}>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Cliente</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Valor</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Vencimento</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: canMarkPaid ? 6 : 5 }).map((_, j) => <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>)}</TableRow>
              ))
            ) : data?.rows && data.rows.length > 0 ? (
              data.rows.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm">{fmtDate(c.created_at)}</TableCell>
                  <TableCell className="font-medium"><button className="hover:underline text-left text-primary/80 hover:text-primary transition-colors" onClick={() => navigate(`/clientes/${c.client_id}`)}>{c.clients?.full_name ?? "—"}</button></TableCell>
                  <TableCell className="font-medium">{fmtCurrency(c.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.due_date ? fmtDate(c.due_date + "T00:00:00") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/cobrancas/${c.id}`)}><Eye className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>Ver</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/cobrancas/${c.id}/editar`)}><Pencil className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                      
                      {canMarkPaid && c.status === "pendente" && (
                        <Button variant="outline" size="sm" className="text-xs ml-1" onClick={() => statusMutation.mutate({ chargeId: c.id, newStatus: "pago" })} disabled={statusMutation.isPending}>
                          Marcar Pago
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" /> Nenhuma cobrança encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      </BlurFade>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Charges;

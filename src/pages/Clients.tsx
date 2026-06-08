import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BlurFade } from "@/components/ui/blur-fade";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, ChevronLeft, ChevronRight, Plus, Eye, Trash2, AlertTriangle, ArrowUpDown, Filter, Loader2, FileSpreadsheet, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { exportToXls } from "@/lib/export-utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { fmtDate } from "@/lib/date";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

const PAGE_SIZE = 20;

type SortColumn = "full_name" | "email" | "phone" | "created_at" | "visit_count" | "last_visit";
type SortDirection = "asc" | "desc";
type FilterType = "all" | "novos" | "ativos" | "inativos";

const SORT_OPTIONS = [
  { value: "full_name__asc", label: "Nome (A-Z)" },
  { value: "full_name__desc", label: "Nome (Z-A)" },
  { value: "visit_count__desc", label: "Mais visitas" },
  { value: "visit_count__asc", label: "Menos visitas" },
  { value: "last_visit__desc", label: "Visitas mais recentes" },
  { value: "last_visit__asc", label: "Visitas mais antigas" },
  { value: "created_at__desc", label: "Cadastro recente" },
  { value: "created_at__asc", label: "Cadastro antigo" },
];

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "novos", label: "Novos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
];

const Clients = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canDelete } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sortKey, setSortKey] = useState("full_name__asc");
  const [filterType, setFilterType] = useState<FilterType>(() => {
    const urlFilter = searchParams.get("filter");
    if (urlFilter && ["all", "novos", "ativos", "inativos"].includes(urlFilter)) return urlFilter as FilterType;
    return "all";
  });
  const debouncedSearch = useDebounce(search, 400);

  const [sortColumn, sortDirection] = sortKey.split("__") as [SortColumn, SortDirection];

  const handleExport = async () => {
    setExporting(true);
    try {
      const allRows: any[] = [];
      let pageNum = 1;
      const batchSize = 500;
      while (true) {
        const rpcParams: Record<string, unknown> = {
          search_term: debouncedSearch,
          page_number: pageNum,
          page_size: batchSize,
          sort_column: sortColumn,
          sort_direction: sortDirection,
        };
        let result = await supabase.rpc("search_clients", { ...rpcParams, filter_type: filterType } as any);
        if (result.error?.code === "PGRST202") {
          result = await supabase.rpc("search_clients", rpcParams as any);
        }
        if (result.error) throw result.error;
        const rows = result.data ?? [];
        if (rows.length === 0) break;
        allRows.push(...rows);
        if (rows.length < batchSize) break;
        pageNum++;
      }
      if (allRows.length === 0) {
        toast.error("Nenhum cliente para exportar");
        return;
      }
      const exportData = allRows.map((c: any) => ({
        Nome: c.full_name || "",
        "E-mail": c.email || "",
        Telefone: c.phone || "",
        "Data Nascimento": c.birth_date ? fmtDate(c.birth_date) : "",
        Visitas: c.visit_count ?? 0,
        "Última Visita": c.last_visit ? fmtDate(c.last_visit) : "",
        Cadastro: fmtDate(c.created_at),
      }));
      const filterLabel = FILTERS.find((f) => f.value === filterType)?.label || "Todos";
      await exportToXls(`Clientes_${filterLabel}`, exportData);
      toast.success(`${allRows.length} clientes exportados`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar clientes");
    } finally {
      setExporting(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await invokeEdgeFunction("delete-client", { body: { client_id: id } });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente removido com sucesso");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erro ao remover cliente");
      setDeleteId(null);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["clients", debouncedSearch, page, sortColumn, sortDirection, filterType],
    queryFn: async () => {
      const makeRpcCall = async (searchTerm: string) => {
        const rpcParams: Record<string, unknown> = {
          search_term: searchTerm,
          page_number: page,
          page_size: PAGE_SIZE,
          sort_column: sortColumn,
          sort_direction: sortDirection,
        };

        let result = await supabase.rpc("search_clients", { ...rpcParams, filter_type: filterType } as any);
        if (result.error?.code === "PGRST202") {
          result = await supabase.rpc("search_clients", rpcParams as any);
        }
        return result;
      };

      const mainResult = await makeRpcCall(debouncedSearch);
      if (mainResult.error) throw mainResult.error;

      const rows = (mainResult.data ?? []) as Array<{
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        cpf: string | null;
        birth_date: string | null;
        notes: string | null;
        created_at: string;
        total_count: number;
        visit_count: number;
        last_visit: string | null;
        first_visit: string | null;
      }>;

      return rows;
    },
  });

  const totalCount = data?.[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between mb-8">
          <PageHeader
            icon={<Users className="w-5 h-5" />}
            title="Clientes"
            subtitle={totalCount > 0 ? `${totalCount} clientes` : "Gerencie sua base de clientes"}
            className="mb-0"
          />
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleExport} disabled={exporting || isLoading} className="gap-1.5 px-3">
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="text-xs font-medium">XLS</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportar Excel</TooltipContent>
            </Tooltip>
            <Button onClick={() => navigate("/clientes/novo")}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>
      </BlurFade>

      {/* Search + Filters + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 h-10"
          />
        </div>

        <Select value={filterType} onValueChange={(v) => { setFilterType(v as FilterType); setPage(1); }}>
          <SelectTrigger className="w-[160px] h-10">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Filtrar..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortKey} onValueChange={(v) => { setSortKey(v); setPage(1); }}>
          <SelectTrigger className="w-[210px] h-10">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Ordenar por..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <BlurFade delay={0.15}>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">Nome</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">E-mail</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Telefone</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Visitas</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Cliente há</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Cadastro</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              data.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <button
                      className="text-left hover:text-primary hover:underline underline-offset-2 transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigate(`/clientes/${client.id}`); }}
                    >
                      {client.full_name}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{client.phone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{client.visit_count}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(client.created_at), { locale: pt, addSuffix: false })}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {fmtDate(client.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/clientes/${client.id}`)}>
                            <Eye className="w-4 h-4" strokeWidth={1.75} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Abrir</TooltipContent>
                      </Tooltip>
                      {canDelete && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(client.id)}>
                              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remover</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum cliente encontrado.
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
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remover cliente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível. Deseja realmente remover este cliente e todos seus dados associados?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) deleteMutation.mutate(deleteId);
              }}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removendo...</>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;

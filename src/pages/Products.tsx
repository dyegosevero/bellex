import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BlurFade } from "@/components/ui/blur-fade";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, Package, Plus, Eye, Pencil, Tags, Trash2, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { fmtCurrency } from "@/lib/date";
import { ProductCategoriesDialog } from "@/components/products/ProductCategoriesDialog";

const PAGE_SIZE = 20;

const Products = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 400);

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_categories").select("name").order("name");
      if (error) throw error;
      return data.map((c) => c.name);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", debouncedSearch, categoryFilter, page, showTrash],
    queryFn: async () => {
      let query = supabase.from("products").select("*", { count: "exact" }).eq("active", !showTrash).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (debouncedSearch) {
        const sanitized = debouncedSearch.replace(/[%_\\]/g, "");
        if (sanitized) {
          query = query.or(`name.ilike.%${sanitized}%,sku.ilike.%${sanitized}%`);
        }
      }
      if (categoryFilter !== "all") query = query.eq("category", categoryFilter);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  const { data: trashCount } = useQuery({
    queryKey: ["products-trash-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("active", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const [trashTarget, setTrashTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleTrashProduct = async () => {
    if (!trashTarget) return;
    const { error } = await supabase.from("products").update({ active: false }).eq("id", trashTarget);
    if (error) { toast.error("Erro ao mover para lixeira."); return; }
    toast.success("Produto movido para a lixeira.");
    setTrashTarget(null);
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["products-trash-count"] });
  };

  const handleRestoreProduct = async (productId: string) => {
    const { error } = await supabase.from("products").update({ active: true }).eq("id", productId);
    if (error) { toast.error("Erro ao restaurar."); return; }
    toast.success("Produto restaurado.");
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["products-trash-count"] });
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget);
    if (error) { toast.error("Erro ao excluir produto."); return; }
    toast.success("Produto excluído definitivamente.");
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["products-trash-count"] });
  };

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <PageHeader
              icon={<Package className="w-5 h-5" />}
              title={showTrash ? "Lixeira" : "Produtos"}
              subtitle={showTrash ? `${data?.count ?? 0} produto(s) na lixeira` : data?.count ? `${data.count} produtos cadastrados` : "Catálogo de produtos físicos para venda"}
              className="mb-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showTrash ? "default" : "outline"}
              size="sm"
              onClick={() => { setShowTrash(!showTrash); setPage(1); }}
              className="gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {showTrash ? "Voltar" : `Lixeira${(trashCount ?? 0) > 0 ? ` (${trashCount})` : ""}`}
            </Button>
            {!showTrash && (
              <>
                <Button variant="outline" onClick={() => setCategoriesOpen(true)}><Tags className="w-4 h-4 mr-2" /> Categorias</Button>
                <Button onClick={() => navigate("/produtos/novo")}><Plus className="w-4 h-4 mr-2" /> Novo Produto</Button>
              </>
            )}
          </div>
        </div>
      </BlurFade>

      <div className="flex gap-3 mb-6">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou SKU..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10 h-10" />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories?.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <BlurFade delay={0.15}>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">Produto</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Categoria</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">SKU</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Preço</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Stock</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>)}</TableRow>
              ))
            ) : data?.rows && data.rows.length > 0 ? (
              data.rows.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {(p as any).image_url ? (
                        <img src={(p as any).image_url} alt={p.name} className="w-8 h-8 rounded object-cover border border-border" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      )}
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.category ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.sku ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtCurrency(Number(p.price))}</TableCell>
                  <TableCell className="text-muted-foreground">{p.stock_quantity}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded ${p.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{p.active ? "Ativo" : "Inativo"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {showTrash ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRestoreProduct(p.id)}><RotateCcw className="w-4 h-4" strokeWidth={1.75} /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Restaurar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p.id)}><Trash2 className="w-4 h-4" strokeWidth={1.75} /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir definitivamente</TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/produtos/${p.id}`)}><Eye className="w-4 h-4" strokeWidth={1.75} /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/produtos/${p.id}/editar`)}><Pencil className="w-4 h-4" strokeWidth={1.75} /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setTrashTarget(p.id)}><Trash2 className="w-4 h-4" strokeWidth={1.75} /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Mover para lixeira</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" /> Nenhum produto cadastrado.
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
      <ProductCategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
      <AlertDialog open={!!trashTarget} onOpenChange={(open) => !open && setTrashTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para Lixeira</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja mover este produto para a lixeira? Poderá restaurá-lo posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleTrashProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Mover para Lixeira
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Definitivamente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto definitivamente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Products;

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { fmtCurrency } from "@/lib/date";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  appointmentId: string;
}

export default function SessionPurchasesTab({ appointmentId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [productSearch, setProductSearch] = useState("");

  const { data: products } = useQuery({
    queryKey: ["products-active"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("active", true).order("name");
      return data ?? [];
    },
  });

  const { data: soldProducts, isLoading } = useQuery({
    queryKey: ["appointment-products", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_products")
        .select("*, products(name, image_url, price)")
        .eq("appointment_id", appointmentId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const product = products?.find((p) => p.id === selectedProduct);
      if (!product) throw new Error("Produto não encontrado");
      if (quantity < 1) throw new Error("Quantidade mínima é 1");
      if (quantity > product.stock_quantity) throw new Error(`Stock insuficiente (disponível: ${product.stock_quantity})`);
      const { error } = await supabase.from("appointment_products").insert({
        appointment_id: appointmentId,
        product_id: selectedProduct,
        quantity,
        unit_price: product.price,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto adicionado!");
      setSelectedProduct("");
      setQuantity(1);
      setQuantityInput("1");
      queryClient.invalidateQueries({ queryKey: ["appointment-products", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["products-active"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao adicionar produto."),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointment_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto removido.");
      queryClient.invalidateQueries({ queryKey: ["appointment-products", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["products-active"] });
    },
    onError: () => toast.error("Erro ao remover."),
  });

  const selectedProductData = products?.find((p) => p.id === selectedProduct);
  const maxStock = selectedProductData?.stock_quantity ?? 999;
  const total = soldProducts?.reduce((sum, sp: any) => sum + sp.unit_price * sp.quantity, 0) ?? 0;
  const specialistName = profiles?.find((p) => p.user_id === user?.id)?.full_name ?? "—";

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider">Compras / Produtos</h2>
      {/* Add product form */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Adicionar Produto</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Produto</label>
            <Select value={selectedProduct} onValueChange={(v) => {
              setSelectedProduct(v);
              const prod = products?.find((p) => p.id === v);
              const stock = prod?.stock_quantity ?? 1;
              const clamped = Math.max(1, Math.min(stock, quantity));
              setQuantity(clamped);
              setQuantityInput(String(clamped));
            }}>
              <SelectTrigger><SelectValue placeholder="Pesquisar produto..." /></SelectTrigger>
              <SelectContent>
                <div className="px-2 pb-2">
                  <Input
                    placeholder="Pesquisar..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="h-8"
                    autoFocus
                  />
                </div>
                {products
                  ?.filter((p) =>
                    p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
                    p.stock_quantity > 0
                  )
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {fmtCurrency(p.price)} (stock: {p.stock_quantity})
                    </SelectItem>
                  ))}
                {products?.filter((p) =>
                  p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
                  p.stock_quantity > 0
                ).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhum produto encontrado</p>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
            <Input
              type="number"
              min={1}
              max={maxStock}
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              onBlur={() => {
                const parsed = parseInt(quantityInput) || 1;
                const clamped = Math.max(1, Math.min(maxStock, parsed));
                setQuantity(clamped);
                setQuantityInput(String(clamped));
              }}
            />
            {selectedProductData && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Disponível: {maxStock}
              </p>
            )}
          </div>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={!selectedProduct || addMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>
        {selectedProductData && (
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            {selectedProductData.image_url && (
              <img
                src={selectedProductData.image_url}
                alt=""
                className="w-12 h-12 rounded border border-border object-cover"
              />
            )}
            <span>Valor unitário: {fmtCurrency(selectedProductData.price)}</span>
          </div>
        )}
      </div>

      {/* Products table */}
      {soldProducts && soldProducts.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Produto</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Qtd</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Valor</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Subtotal</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {soldProducts.map((sp: any) => (
                <TableRow key={sp.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {sp.products?.image_url && (
                      <img
                        src={sp.products.image_url}
                        alt=""
                        className="w-8 h-8 rounded border border-border object-cover"
                      />
                    )}
                    {sp.products?.name ?? "—"}
                  </TableCell>
                  <TableCell>{sp.quantity}</TableCell>
                  <TableCell className="text-right">{fmtCurrency(sp.unit_price)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtCurrency(sp.unit_price * sp.quantity)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeMutation.mutate(sp.id)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right text-xs uppercase tracking-wider text-muted-foreground">Total</TableCell>
                <TableCell className="text-right font-bold text-lg">{fmtCurrency(total)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm">Nenhum produto vendido neste atendimento.</p>
        </div>
      )}
    </div>
  );
}

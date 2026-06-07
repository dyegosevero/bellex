import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit, Package } from "lucide-react";
import { fmtCurrency, fmtDate } from "@/lib/date";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: salesHistory } = useQuery({
    queryKey: ["product-sales", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_products")
        .select("id, quantity, unit_price, created_at, appointments(start_time, clients(full_name))")
        .eq("product_id", id!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!product) return <p className="text-muted-foreground text-center py-12">Produto não encontrado.</p>;

  const totalSold = salesHistory?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
  const totalRevenue = salesHistory?.reduce((sum, s) => sum + s.quantity * s.unit_price, 0) ?? 0;

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate("/produtos")}><ArrowLeft className="w-4 h-4" /></Button>
        <Button variant="outline" onClick={() => navigate(`/produtos/${id}/editar`)}><Edit className="w-4 h-4 mr-2" /> Editar</Button>
      </div>

      {/* E-commerce layout: image left, details right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product image */}
        <div className="bg-card border border-border rounded-lg overflow-hidden flex items-center justify-center aspect-square">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-16 h-16 text-muted-foreground/30" />
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-light tracking-wider">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {product.category ?? "Sem categoria"}
              {product.sku && <span className="ml-2">· SKU: {product.sku}</span>}
            </p>
            {product.brand && <p className="text-sm text-muted-foreground">Marca: {product.brand}</p>}
          </div>

          <p className="text-3xl font-light tracking-wide">{fmtCurrency(product.price)}</p>

          <div className="flex items-center gap-2">
            <StatusBadge status={product.active ? "ativo" : "inativo"} />
            {product.category && <Badge variant="outline">{product.category}</Badge>}
          </div>

          {product.description && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Descrição</p>
              <p className="text-sm">{product.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Stock" value={`${product.stock_quantity} un.`} />
            <InfoCard label="Vendidos" value={`${totalSold} un.`} />
            <InfoCard label="Receita" value={fmtCurrency(totalRevenue)} />
          </div>
        </div>
      </div>

      {/* Sales history */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Histórico de Vendas</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Cliente</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Qtd</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesHistory && salesHistory.length > 0 ? (
              salesHistory.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{fmtDate(s.created_at)}</TableCell>
                  <TableCell>{s.appointments?.clients?.full_name ?? "—"}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell className="text-right">{fmtCurrency(s.quantity * s.unit_price)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma venda registrada</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
    <p className="text-lg font-light">{value}</p>
  </div>
);

export default ProductDetail;

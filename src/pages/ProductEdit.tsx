import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm } from "@/components/products/ProductForm";
import { Skeleton } from "@/components/ui/skeleton";

const ProductEdit = () => {
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!product) return <p className="text-muted-foreground text-center py-12">Produto não encontrado.</p>;

  return (
    <ProductForm
      mode="edit"
      initialData={{
        id: product.id,
        name: product.name,
        description: product.description ?? "",
        sku: product.sku ?? "",
        brand: (product as any).brand ?? "",
        price: product.price?.toString() ?? "0",
        stock_quantity: product.stock_quantity?.toString() ?? "0",
        category: product.category ?? "",
        active: product.active,
        image_url: (product as any).image_url ?? null,
      }}
    />
  );
};

export default ProductEdit;

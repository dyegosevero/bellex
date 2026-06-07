import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Search, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
}

interface Props {
  value: { id: string; name: string }[];
  onChange: (products: { id: string; name: string }[]) => void;
  readOnly?: boolean;
}

export function ProductSuggestionSelect({ value, onChange, readOnly }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: products } = useQuery({
    queryKey: ["all-products-for-suggestion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, image_url")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedIds = new Set(value.map((p) => p.id));

  const filtered = (products ?? []).filter(
    (p) =>
      !selectedIds.has(p.id) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const addProduct = (product: Product) => {
    onChange([...value, { id: product.id, name: product.name }]);
    setSearch("");
    setOpen(false);
  };

  const removeProduct = (id: string) => {
    onChange(value.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-2">
      {/* Tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((p) => (
            <Badge key={p.id} variant="secondary" className="gap-1 text-xs py-1 px-2">
              <Package className="w-3 h-3" />
              {p.name}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeProduct(p.id)}
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      {!readOnly && (
        <div ref={wrapperRef} className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar produto para sugerir..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className="pl-8"
            />
          </div>

          {open && filtered.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-48 overflow-auto">
              {filtered.slice(0, 20).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-6 h-6 rounded object-cover shrink-0" />
                  ) : (
                    <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span>{p.name}</span>
                  {p.brand && (
                    <span className="text-muted-foreground ml-auto">({p.brand})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {open && search && filtered.length === 0 && (
            <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-md p-3 text-xs text-muted-foreground text-center">
              Nenhum produto encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}

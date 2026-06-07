import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Upload, Trash2, ImageIcon } from "lucide-react";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().max(50).optional(),
  brand: z.string().max(100).optional(),
  price: z.string().min(1, "Informe o preço"),
  stock_quantity: z.string(),
  category: z.string().optional(),
  active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData> & { id?: string; image_url?: string | null };
  mode?: "create" | "edit";
}

export const ProductForm = ({ initialData, mode = "create" }: ProductFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("name")
        .order("name");
      if (error) throw error;
      return data.map((c) => c.name);
    },
  });

  const [form, setForm] = useState<ProductFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    sku: initialData?.sku ?? "",
    brand: initialData?.brand ?? "",
    price: initialData?.price ?? "0",
    stock_quantity: initialData?.stock_quantity ?? "0",
    category: initialData?.category ?? "",
    active: initialData?.active ?? true,
  });

  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Selecione um ficheiro de imagem.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Ficheiro muito grande", description: "Máximo de 5MB.", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl;
    setUploading(true);
    try {
      const ext = imageFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast({ title: "Erro ao enviar imagem", description: err.message, variant: "destructive" });
      return imageUrl;
    } finally {
      setUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const uploadedUrl = await uploadImage();
      const payload = {
        name: data.name.trim(),
        description: data.description || null,
        sku: data.sku || null,
        brand: data.brand || null,
        price: parseFloat(data.price) || 0,
        stock_quantity: parseInt(data.stock_quantity) || 0,
        category: data.category || null,
        active: data.active,
        image_url: uploadedUrl,
      };

      if (mode === "edit" && initialData?.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["active-products"] });
      toast({
        title: mode === "edit" ? "Produto atualizado" : "Produto cadastrado",
        description: "Salvo com sucesso.",
      });
      navigate("/produtos");
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = productSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data);
  };

  const set = (field: keyof ProductFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/produtos")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-light tracking-wider">
            {mode === "edit" ? "Editar Produto" : "Novo Produto"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Preencha os dados do produto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column — Image card */}
          <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col items-center justify-center aspect-square p-6">
            {imagePreview ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-full rounded-lg object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={removeImage}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
              >
                <ImageIcon className="w-12 h-12" />
                <span className="text-sm">Adicionar imagem</span>
              </button>
            )}
            {imagePreview && (
              <Button type="button" variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3.5 h-3.5" /> Trocar
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>

          {/* Right column — Fields card */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-5">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Ex: La Roche-Posay" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Preço (€) *</Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.price}
                  onChange={(e) => {
                    // Allow only digits, comma and dot
                    let raw = e.target.value.replace(/[^0-9.,]/g, "");
                    // Replace comma with dot for internal storage
                    raw = raw.replace(",", ".");
                    // Allow only one dot
                    const parts = raw.split(".");
                    if (parts.length > 2) raw = parts[0] + "." + parts.slice(1).join("");
                    // Limit decimals to 2
                    if (parts.length === 2 && parts[1].length > 2) {
                      raw = parts[0] + "." + parts[1].slice(0, 2);
                    }
                    set("price", raw);
                  }}
                  className="mt-1"
                />
                {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock_quantity">Stock</Label>
                <Input id="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} className="mt-1" />
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-3">
                  <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
                  <Label>Produto ativo</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1" />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button type="submit" disabled={mutation.isPending || uploading}>
                {(mutation.isPending || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === "edit" ? "Salvar Alterações" : "Cadastrar Produto"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/produtos")}>Cancelar</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export interface BookingPageSettings {
  id: string;
  title: string | null;
  logo_url: string | null;
  cover_url: string | null;
  background_color: string | null;
  footer_notes: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_website: string | null;
  allow_specialist_choice: boolean;
  categories_expanded: boolean;
  require_email: boolean;
  require_gender: boolean;
  require_nif: boolean;
  require_birth_date: boolean;
  tracking_code: string | null;
  terms_url: string | null;
  privacy_url: string | null;
  marketing_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: BookingPageSettings | null;
  onSaved: () => void;
}

export function BookingEditSidebar({ open, onOpenChange, settings, onSaved }: Props) {
  const [form, setForm] = useState<Partial<BookingPageSettings>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const update = (key: keyof BookingPageSettings, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileUpload = async (file: File, type: "logo" | "cover") => {
    setUploading(type);
    try {
      const ext = file.name.split(".").pop();
      const path = `booking-${type}-${Date.now()}.${ext}`;
      const { error } = await storage.from("product-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = storage.from("product-images").getPublicUrl(path);
      update(type === "logo" ? "logo_url" : "cover_url", urlData.publicUrl);
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload.");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title ?? "Agendar",
        logo_url: form.logo_url ?? null,
        cover_url: form.cover_url ?? null,
        background_color: form.background_color ?? "#f5f0eb",
        footer_notes: form.footer_notes ?? null,
        social_instagram: form.social_instagram ?? null,
        social_facebook: form.social_facebook ?? null,
        social_website: form.social_website ?? null,
        allow_specialist_choice: form.allow_specialist_choice ?? true,
        categories_expanded: form.categories_expanded ?? false,
        require_email: form.require_email ?? true,
        require_gender: form.require_gender ?? false,
        require_nif: form.require_nif ?? false,
        require_birth_date: form.require_birth_date ?? false,
        tracking_code: form.tracking_code ?? null,
        terms_url: form.terms_url ?? null,
        privacy_url: form.privacy_url ?? null,
        marketing_url: form.marketing_url ?? null,
      };

      let error;
      if (settings?.id) {
        ({ error } = await supabase
          .from("booking_page_settings")
          .update(payload)
          .eq("id", settings.id));
      } else {
        ({ error } = await supabase
          .from("booking_page_settings")
          .insert(payload));
      }
      if (error) throw error;

      toast.success("Configurações guardadas.");
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao gravar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Personalizar Página</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Personalização */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Personalização</h3>

            <div className="space-y-2">
              <Label>Título da Página</Label>
              <Input
                value={form.title || ""}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Agendar"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {form.logo_url && (
                  <div className="relative">
                    <img src={form.logo_url} alt="Logo" className="h-10 w-10 rounded-lg object-contain border" />
                    <button
                      type="button"
                      onClick={() => update("logo_url", null)}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-destructive-foreground w-4 h-4 flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, "logo");
                  }}
                  className="flex-1"
                />
                {uploading === "logo" && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagem de Capa</Label>
              <div className="space-y-2">
                {form.cover_url && (
                  <div className="relative">
                    <img src={form.cover_url} alt="Capa" className="h-24 w-full rounded-lg object-cover border" />
                    <button
                      type="button"
                      onClick={() => update("cover_url", null)}
                      className="absolute top-1 right-1 rounded-full bg-destructive text-destructive-foreground w-5 h-5 flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, "cover");
                  }}
                />
                {uploading === "cover" && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.background_color || "#f5f0eb"}
                  onChange={(e) => update("background_color", e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={form.background_color || "#f5f0eb"}
                  onChange={(e) => update("background_color", e.target.value)}
                  className="flex-1"
                  placeholder="#f5f0eb"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas de Rodapé</Label>
              <Textarea
                value={form.footer_notes || ""}
                onChange={(e) => update("footer_notes", e.target.value)}
                placeholder="Texto exibido no fundo da página..."
                rows={2}
              />
            </div>
          </section>

          <Separator />

          {/* Redes sociais */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Redes Sociais</h3>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={form.social_instagram || ""}
                onChange={(e) => update("social_instagram", e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                value={form.social_facebook || ""}
                onChange={(e) => update("social_facebook", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={form.social_website || ""}
                onChange={(e) => update("social_website", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </section>

          <Separator />

          {/* Mais Opções */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Mais Opções</h3>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Permitir escolha de colaborador</Label>
              <Switch
                checked={form.allow_specialist_choice ?? true}
                onCheckedChange={(v) => update("allow_specialist_choice", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Categorias expandidas por padrão</Label>
              <Switch
                checked={form.categories_expanded ?? false}
                onCheckedChange={(v) => update("categories_expanded", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">E-mail obrigatório</Label>
              <Switch
                checked={form.require_email ?? true}
                onCheckedChange={(v) => update("require_email", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Pedir género</Label>
              <Switch
                checked={form.require_gender ?? false}
                onCheckedChange={(v) => update("require_gender", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Pedir CPF</Label>
              <Switch
                checked={form.require_nif ?? false}
                onCheckedChange={(v) => update("require_nif", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Pedir data de nascimento</Label>
              <Switch
                checked={form.require_birth_date ?? false}
                onCheckedChange={(v) => update("require_birth_date", v)}
              />
            </div>

            <div className="space-y-2">
              <Label>Link dos Termos e Condições</Label>
              <Input
                value={form.terms_url || ""}
                onChange={(e) => update("terms_url", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Link da Política de Privacidade</Label>
              <Input
                value={form.privacy_url || ""}
                onChange={(e) => update("privacy_url", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Link da Política de Marketing</Label>
              <Input
                value={form.marketing_url || ""}
                onChange={(e) => update("marketing_url", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Código de Rastreamento</Label>
              <Textarea
                value={form.tracking_code || ""}
                onChange={(e) => update("tracking_code", e.target.value)}
                placeholder="<script>...</script>"
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          </section>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

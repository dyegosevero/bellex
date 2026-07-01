import { useState } from "react";
import { useSaCoupons, Coupon } from "@/hooks/useSaCoupons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  code: "",
  description: "",
  discount_type: "fixed" as "fixed" | "percent",
  discount_value: 0,
  max_uses: null as number | null,
  valid_until: null as string | null,
  active: true,
};

export default function SaCupons() {
  const { coupons, loading, create, toggle } = useSaCoupons();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof EMPTY, v: unknown) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.code.trim()) { toast.error("Código do cupom obrigatório"); return; }
    if (!form.discount_value || form.discount_value <= 0) { toast.error("Desconto deve ser maior que zero"); return; }
    setSaving(true);
    const ok = await create({
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_uses: form.max_uses || null,
      valid_until: form.valid_until || null,
      active: true,
    });
    setSaving(false);
    if (ok) { setOpen(false); setForm({ ...EMPTY }); }
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-lg font-semibold">Cupons de desconto</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Descontos aplicados na mensalidade de workspaces específicos</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(v => !v)}>
          <Plus className="w-3.5 h-3.5" /> Novo cupom
        </Button>
      </div>

      {/* Form inline */}
      {open && (
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
          <p className="text-sm font-semibold">Criar cupom</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Código *</Label>
              <Input
                placeholder="ex: LONGITY"
                value={form.code}
                onChange={e => set("code", e.target.value.toUpperCase())}
                className="uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Input
                placeholder="ex: Desconto parceria Bruna"
                value={form.description}
                onChange={e => set("description", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de desconto</Label>
              <Select value={form.discount_type} onValueChange={v => set("discount_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {form.discount_type === "fixed" ? "Desconto (R$)" : "Desconto (%)"}
              </Label>
              <Input
                type="number"
                min={0}
                max={form.discount_type === "percent" ? 100 : undefined}
                value={form.discount_value || ""}
                onChange={e => set("discount_value", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Uso máximo (vazio = ilimitado)</Label>
              <Input
                type="number"
                min={1}
                placeholder="ilimitado"
                value={form.max_uses ?? ""}
                onChange={e => set("max_uses", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Válido até (vazio = sem expiração)</Label>
              <Input
                type="date"
                value={form.valid_until ?? ""}
                onChange={e => set("valid_until", e.target.value || null)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setOpen(false); setForm({ ...EMPTY }); }}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Criar cupom
            </Button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground/40">
          <Tag className="w-10 h-10" />
          <p className="text-sm">Nenhum cupom cadastrado</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <div className="grid grid-cols-[120px_1fr_120px_80px_80px_48px] px-4 py-2.5 border-b border-border/40 bg-muted/30">
            {["Código", "Descrição", "Desconto", "Usos", "Validade", ""].map(h => (
              <span key={h} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.07em]">{h}</span>
            ))}
          </div>
          {coupons.map(c => (
            <div key={c.id} className={`grid grid-cols-[120px_1fr_120px_80px_80px_48px] px-4 py-3 border-b border-border/20 last:border-0 items-center ${!c.active ? "opacity-50" : ""}`}>
              <span className="text-[13px] font-mono font-semibold tracking-wide">{c.code}</span>
              <span className="text-[12px] text-muted-foreground truncate pr-4">{c.description ?? "—"}</span>
              <span className="text-[13px] font-medium">
                {c.discount_type === "fixed"
                  ? `−R$ ${Number(c.discount_value).toLocaleString("pt-BR")}`
                  : `−${c.discount_value}%`}
              </span>
              <span className="text-[12px] text-muted-foreground">
                {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}
              </span>
              <span className="text-[12px] text-muted-foreground">
                {c.valid_until ? new Date(c.valid_until).toLocaleDateString("pt-BR") : "∞"}
              </span>
              <button
                onClick={() => toggle(c.id, !c.active)}
                className={`flex items-center justify-center transition-colors ${c.active ? "text-green-500 hover:text-muted-foreground" : "text-muted-foreground hover:text-green-500"}`}
                title={c.active ? "Desativar" : "Ativar"}
              >
                {c.active
                  ? <ToggleRight className="w-5 h-5" />
                  : <ToggleLeft className="w-5 h-5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

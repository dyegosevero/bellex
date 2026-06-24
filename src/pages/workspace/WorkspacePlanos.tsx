import { useState } from "react";
import { CreditCard, Check, Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useWorkspacePlans, type WorkspacePlan } from "@/hooks/useWorkspacePlans";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";

const COLORS = ["#e8957a", "#60a5fa", "#a78bfa", "#34d399", "#f59e0b", "#f43f5e"];

const EMPTY_FORM = {
  name: "",
  price: "",
  seats_limit: "1",
  ai_conversations_month: "250",
  storage_gb: "5",
  color: "#e8957a",
  popular: false,
  features: "",
  active: true,
};

export default function WorkspacePlanos() {
  const { plans, loading, create, update, remove } = useWorkspacePlans();
  const { licenses } = useWorkspaceLicenses();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkspacePlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const activeByPlan = (name: string) =>
    licenses.filter(l => l.plan === name.toLowerCase() && l.status === "ativo").length;

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(p: WorkspacePlan) {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      seats_limit: String(p.seats_limit),
      ai_conversations_month: String(p.ai_conversations_month ?? 250),
      storage_gb: String(p.storage_gb ?? 5),
      color: p.color,
      popular: p.popular,
      features: p.features.join("\n"),
      active: p.active,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      seats_limit: parseInt(form.seats_limit) || 1,
      ai_conversations_month: parseInt(form.ai_conversations_month) || 250,
      storage_gb: parseInt(form.storage_gb) || 5,
      color: form.color,
      popular: form.popular,
      features: form.features.split("\n").map(f => f.trim()).filter(Boolean),
      active: form.active,
    };
    const ok = editing ? await update(editing.id, payload) : await create(payload);
    setSaving(false);
    if (ok) setOpen(false);
  }

  async function handleRemove(p: WorkspacePlan) {
    if (!confirm(`Remover o plano "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    await remove(p.id);
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        icon={<CreditCard className="w-5 h-5" />}
        title="Planos"
        subtitle="Configure os planos que seus clientes podem contratar"
      />

      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo plano
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando planos...
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum plano cadastrado.</p>
          <p className="text-xs mt-1">Clique em "Novo plano" para começar.</p>
        </div>
      )}

      {!loading && plans.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(p => (
            <div key={p.id} className="relative rounded-2xl border border-border/40 bg-card overflow-hidden">
              {p.popular && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-white text-[10px]">Mais popular</Badge>
                </div>
              )}
              {!p.active && (
                <div className="absolute top-4 left-4">
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Inativo</Badge>
                </div>
              )}
              <div className="h-1.5" style={{ background: p.color }} />
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-lg font-bold">{p.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold">
                      R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    <span className="text-xs text-muted-foreground">
                      🏥 {p.seats_limit} {p.seats_limit === 1 ? "clínica" : "clínicas"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      🤖 {p.ai_conversations_month} conv. IA/mês
                    </span>
                    <span className="text-xs text-muted-foreground">
                      💾 {p.storage_gb} GB
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <strong>{activeByPlan(p.name)}</strong> ativo{activeByPlan(p.name) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {p.features.length > 0 && (
                  <div className="space-y-2">
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: p.color }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border/40">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEdit(p)}>
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive gap-1.5"
                    onClick={() => handleRemove(p)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar / editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar plano" : "Novo plano"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  placeholder="Ex: Pro"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preço / mês (R$)</Label>
                <Input
                  type="number"
                  placeholder="397"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Clínicas (seats)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={form.seats_limit}
                  onChange={e => setForm(f => ({ ...f, seats_limit: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Conv. IA / mês</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="250"
                  value={form.ai_conversations_month}
                  onChange={e => setForm(f => ({ ...f, ai_conversations_month: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Storage (GB)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="5"
                  value={form.storage_gb}
                  onChange={e => setForm(f => ({ ...f, storage_gb: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{
                      background: c,
                      borderColor: form.color === c ? "#1a1a1a" : "transparent",
                      transform: form.color === c ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-6 h-6 rounded cursor-pointer border border-border"
                  title="Cor personalizada"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Features <span className="text-muted-foreground font-normal">(uma por linha)</span></Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                rows={5}
                placeholder={"Agenda online\nCobranças\nSuporte prioritário"}
                value={form.features}
                onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Destacar como popular</Label>
              <Switch
                checked={form.popular}
                onCheckedChange={v => setForm(f => ({ ...f, popular: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Plano ativo</Label>
              <Switch
                checked={form.active}
                onCheckedChange={v => setForm(f => ({ ...f, active: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.price}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {editing ? "Salvar" : "Criar plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

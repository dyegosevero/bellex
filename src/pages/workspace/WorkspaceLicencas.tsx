import { Key, Plus, AlertTriangle, CheckCircle2, XCircle, Clock, MoreHorizontal, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";

const statusIcon: Record<string, React.ReactNode> = {
  ativo: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  expirando: <Clock className="w-4 h-4 text-amber-500" />,
  trial: <Clock className="w-4 h-4 text-blue-500" />,
  suspenso: <XCircle className="w-4 h-4 text-red-500" />,
  cancelado: <XCircle className="w-4 h-4 text-gray-400" />,
};

const statusBadge: Record<string, string> = {
  ativo: "bg-green-50 text-green-700 border-green-200",
  expirando: "bg-amber-50 text-amber-700 border-amber-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
  suspenso: "bg-red-50 text-red-700 border-red-200",
  cancelado: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function WorkspaceLicencas() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ client_name: "", plan: "starter", seats_total: "1", valid_until: "" });
  const { licenses, loading, create, update, remove } = useWorkspaceLicenses();

  const expiring = licenses.filter(l => {
    if (!l.valid_until) return false;
    const days = (new Date(l.valid_until).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30 && l.status !== "suspenso";
  });

  const handleCreate = async () => {
    if (!form.client_name || !form.plan) return;
    setSubmitting(true);
    const { error } = await create({
      client_name: form.client_name,
      plan: form.plan as "starter" | "pro" | "scale",
      seats_total: parseInt(form.seats_total) || 1,
      valid_until: form.valid_until || null,
    });
    setSubmitting(false);
    if (error) toast.error("Erro ao criar licença");
    else { toast.success("Licença criada!"); setOpen(false); setForm({ client_name: "", plan: "starter", seats_total: "1", valid_until: "" }); }
  };

  const handleSuspend = async (id: string) => {
    const { error } = await update(id, { status: "suspenso" });
    if (error) toast.error("Erro ao suspender"); else toast.success("Licença suspensa");
  };

  const handleActivate = async (id: string) => {
    const { error } = await update(id, { status: "ativo" });
    if (error) toast.error("Erro ao ativar"); else toast.success("Licença ativada");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta licença?")) return;
    const { error } = await remove(id);
    if (error) toast.error("Erro ao remover"); else toast.success("Licença removida");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<Key className="w-5 h-5" />} title="Licenças" subtitle="Gestão de licenças e seats por cliente" />

      {expiring.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">{expiring.length} licença{expiring.length > 1 ? "s" : ""} expirando em breve</p>
            {expiring.map(l => (
              <p key={l.id} className="text-xs text-amber-700 mt-0.5">
                {l.client_name} — {l.plan} · expira em {new Date(l.valid_until!).toLocaleDateString("pt-BR")}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Nova licença
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando licenças...
        </div>
      )}

      {!loading && licenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
          <Key className="w-10 h-10 opacity-20" />
          <p className="text-sm">Nenhuma licença cadastrada.</p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Criar primeira licença
          </Button>
        </div>
      )}

      {!loading && licenses.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {licenses.map(l => (
            <div key={l.id} className="rounded-2xl border border-border/40 bg-card p-5 space-y-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{l.client_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {l.plan.charAt(0).toUpperCase() + l.plan.slice(1)} · <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{l.license_key}</code>
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-7 h-7">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {l.status !== "suspenso"
                      ? <DropdownMenuItem className="text-orange-600" onClick={() => handleSuspend(l.id)}>Suspender</DropdownMenuItem>
                      : <DropdownMenuItem className="text-green-600" onClick={() => handleActivate(l.id)}>Reativar</DropdownMenuItem>
                    }
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(l.id)}>Remover</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Seats usados</span>
                  <span className="font-medium">{l.seats_used} / {l.seats_total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((l.seats_used / l.seats_total) * 100, 100)}%`,
                      background: l.seats_used >= l.seats_total ? "#f87171" : "hsl(var(--primary))"
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {statusIcon[l.status]}
                  <span>{l.valid_until ? `Válida até ${new Date(l.valid_until).toLocaleDateString("pt-BR")}` : "Sem vencimento"}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[l.status] ?? ""}`}>
                  {l.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova licença</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome do cliente</Label>
              <Input placeholder="Ex: Ana Costa" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select value={form.plan} onValueChange={v => setForm(f => ({ ...f, plan: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Seats</Label>
                <Input type="number" min={1} value={form.seats_total} onChange={e => setForm(f => ({ ...f, seats_total: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Válida até (opcional)</Label>
              <Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={submitting || !form.client_name}>
              {submitting ? "Criando..." : "Criar licença"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

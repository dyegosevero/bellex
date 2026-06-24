import { useState } from "react";
import { Key, Plus, AlertTriangle, CheckCircle2, XCircle, Clock, MoreHorizontal, Loader2, Infinity, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { useWorkspacePlans } from "@/hooks/useWorkspacePlans";

const ESTADOS_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const statusIcon: Record<string, React.ReactNode> = {
  ativo:     <CheckCircle2 className="w-4 h-4 text-green-500" />,
  expirando: <Clock className="w-4 h-4 text-amber-500" />,
  trial:     <Clock className="w-4 h-4 text-blue-500" />,
  suspenso:  <XCircle className="w-4 h-4 text-red-500" />,
  cancelado: <XCircle className="w-4 h-4 text-gray-400" />,
};

const statusBadge: Record<string, string> = {
  ativo:     "bg-green-50 text-green-700 border-green-200",
  expirando: "bg-amber-50 text-amber-700 border-amber-200",
  trial:     "bg-blue-50 text-blue-700 border-blue-200",
  suspenso:  "bg-red-50 text-red-700 border-red-200",
  cancelado: "bg-gray-50 text-gray-500 border-gray-200",
};

const EMPTY_FORM = {
  client_name:   "",
  document:      "",
  contact_email: "",
  contact_phone: "",
  address:       "",
  city:          "",
  state:         "",
  zip_code:      "",
  plan:          "",
  license_type:  "anual" as "anual" | "vitalicia",
  seats_total:   "1",
  valid_until:   "",
  notes:         "",
};

export default function WorkspaceLicencas() {
  const { licenses, loading, create, update, remove } = useWorkspaceLicenses();
  const { plans, loading: plansLoading } = useWorkspacePlans();

  const [open, setOpen]             = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const f = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const expiring = licenses.filter(l => {
    if (!l.valid_until) return false;
    const days = (new Date(l.valid_until).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30 && l.status !== "suspenso";
  });

  const handleOpen = () => {
    setForm({ ...EMPTY_FORM, plan: plans[0]?.name ?? "" });
    setOpen(true);
  };

  const handleCreate = async () => {
    if (!form.client_name.trim()) { toast.error("Nome do cliente obrigatório"); return; }
    if (!form.plan)               { toast.error("Selecione um plano"); return; }
    if (form.license_type === "anual" && !form.valid_until) {
      toast.error("Informe a data de vencimento"); return;
    }
    setSubmitting(true);
    const { error } = await create({
      client_name:   form.client_name.trim(),
      document:      form.document.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      address:       form.address.trim() || null,
      city:          form.city.trim() || null,
      state:         form.state || null,
      zip_code:      form.zip_code.trim() || null,
      plan:          form.plan,
      license_type:  form.license_type,
      seats_total:   parseInt(form.seats_total) || 1,
      valid_until:   form.license_type === "vitalicia" ? null : form.valid_until || null,
      notes:         form.notes.trim() || null,
    });
    setSubmitting(false);
    if (error) toast.error("Erro ao cadastrar: " + error);
    else { toast.success("Cliente cadastrado!"); setOpen(false); }
  };

  const handleSuspend  = async (id: string) => { const { error } = await update(id, { status: "suspenso" }); if (error) toast.error("Erro"); else toast.success("Licença suspensa"); };
  const handleActivate = async (id: string) => { const { error } = await update(id, { status: "ativo"    }); if (error) toast.error("Erro"); else toast.success("Licença ativada");  };
  const handleDelete   = async (id: string) => {
    if (!confirm("Remover este cliente permanentemente?")) return;
    const { error } = await remove(id);
    if (error) toast.error("Erro ao remover"); else toast.success("Removido");
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader icon={<Key className="w-5 h-5" />} title="Clientes" subtitle="Gestão de clientes e licenças" />

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
        <Button size="sm" onClick={handleOpen} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo cliente
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      )}

      {!loading && licenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
          <Key className="w-10 h-10 opacity-20" />
          <p className="text-sm">Nenhum cliente cadastrado.</p>
          <Button size="sm" variant="outline" onClick={handleOpen}>
            <Plus className="w-4 h-4 mr-1.5" /> Cadastrar primeiro cliente
          </Button>
        </div>
      )}

      {!loading && licenses.length > 0 && (
        <div className="space-y-3">
          {licenses.map(l => (
            <div key={l.id} className="rounded-2xl border border-border/40 bg-card overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{l.client_name}</p>
                    {l.document && <span className="text-xs text-muted-foreground font-mono">{l.document}</span>}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[l.status] ?? ""}`}>
                      {l.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-muted-foreground">
                    <span>{l.plan}</span>
                    {l.contact_email && <span>{l.contact_email}</span>}
                    {l.contact_phone && <span>{l.contact_phone}</span>}
                    <span>
                      {l.license_type === "vitalicia"
                        ? <span className="inline-flex items-center gap-0.5">Vitalícia <Infinity className="w-3 h-3" /></span>
                        : l.valid_until ? `Vence ${new Date(l.valid_until).toLocaleDateString("pt-BR")}` : "Anual"
                      }
                    </span>
                    <span>{l.seats_used}/{l.seats_total} clínicas</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {statusIcon[l.status]}
                  <button
                    onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                    className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                  >
                    {expandedId === l.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-7 h-7">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {l.status !== "suspenso"
                        ? <DropdownMenuItem className="text-orange-600" onClick={() => handleSuspend(l.id)}>Suspender</DropdownMenuItem>
                        : <DropdownMenuItem className="text-green-600"  onClick={() => handleActivate(l.id)}>Reativar</DropdownMenuItem>
                      }
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(l.id)}>Remover</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {expandedId === l.id && (
                <div className="border-t border-border/30 px-4 py-3 bg-muted/20 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {(l.address || l.city) && (
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold mb-0.5">Endereço</p>
                      <p>{[l.address, l.city, l.state, l.zip_code].filter(Boolean).join(", ")}</p>
                    </div>
                  )}
                  {l.license_key && (
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold mb-0.5">Chave</p>
                      <p className="font-mono truncate">{l.license_key}</p>
                    </div>
                  )}
                  {l.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold mb-0.5">Observações</p>
                      <p className="text-muted-foreground">{l.notes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold mb-0.5">Desde</p>
                    <p>{new Date(l.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Dados pessoais */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados do cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Nome completo ou razão social <span className="text-destructive">*</span></Label>
                  <Input placeholder="Clínica Estética Silva Ltda" value={form.client_name} onChange={f("client_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF / CNPJ</Label>
                  <Input placeholder="000.000.000-00" value={form.document} onChange={f("document")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone / WhatsApp</Label>
                  <Input placeholder="(11) 99999-9999" value={form.contact_phone} onChange={f("contact_phone")} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>E-mail de contato</Label>
                  <Input type="email" placeholder="contato@clinica.com.br" value={form.contact_email} onChange={f("contact_email")} />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-3">
                  <Label>Rua / Av.</Label>
                  <Input placeholder="Rua das Flores, 123 — Jardim Paulista" value={form.address} onChange={f("address")} />
                </div>
                <div className="space-y-1.5">
                  <Label>CEP</Label>
                  <Input placeholder="00000-000" value={form.zip_code} onChange={f("zip_code")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cidade</Label>
                  <Input placeholder="São Paulo" value={form.city} onChange={f("city")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Select value={form.state} onValueChange={v => setForm(p => ({ ...p, state: v }))}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Plano e licença */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plano e licença</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Plano <span className="text-destructive">*</span></Label>
                  <Select value={form.plan} onValueChange={v => setForm(p => ({ ...p, plan: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={plansLoading ? "Carregando..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.filter(p => p.active).map(p => (
                        <SelectItem key={p.id} value={p.name}>{p.name} — R$ {p.price}/mês</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Clínicas permitidas (seats)</Label>
                  <Input type="number" min={1} value={form.seats_total} onChange={f("seats_total")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de licença <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["anual", "vitalicia"] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, license_type: type, valid_until: type === "vitalicia" ? "" : p.valid_until }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        form.license_type === type
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {type === "vitalicia" ? <Infinity className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      {type === "anual" ? "Anual" : "Vitalícia"}
                    </button>
                  ))}
                </div>
              </div>

              {form.license_type === "anual" && (
                <div className="space-y-1.5">
                  <Label>Data de vencimento <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.valid_until} onChange={f("valid_until")} />
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label>Observações internas</Label>
              <Textarea
                placeholder="Condições especiais, histórico, notas..."
                rows={3}
                value={form.notes}
                onChange={f("notes")}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Cadastrar cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

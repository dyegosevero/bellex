import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSaWorkspaces, WorkspaceCustomer } from "@/hooks/useSaWorkspaces";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
import { useSaPlans } from "@/hooks/useSaPlans";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Building2, Save } from "lucide-react";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  ativo: "#22c55e", trial: "#60a5fa", inadimplente: "#ef4444",
  suspenso: "#f59e0b", cancelado: "#64748b", expirando: "#f97316",
};

type EditState = {
  client_name: string;
  contact_email: string;
  contact_phone: string;
  document: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes: string;
  plan: string;
  status: WorkspaceCustomer["status"];
  license_type: "anual" | "vitalicia";
  valid_until: string;
};

function wsToEdit(ws: WorkspaceCustomer): EditState {
  return {
    client_name: ws.client_name,
    contact_email: ws.contact_email ?? "",
    contact_phone: ws.contact_phone ?? "",
    document: ws.document ?? "",
    address: ws.address ?? "",
    city: ws.city ?? "",
    state: ws.state ?? "",
    zip_code: ws.zip_code ?? "",
    notes: ws.notes ?? "",
    plan: ws.plan,
    status: ws.status,
    license_type: ws.license_type,
    valid_until: ws.valid_until ? ws.valid_until.split("T")[0] : "",
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

export default function SaWorkspaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workspaces, loading: wsLoading, update } = useSaWorkspaces();
  const { clinics } = useWorkspaceClinics();
  const { plans: saPlans } = useSaPlans();

  const ws = workspaces.find(w => w.id === id) ?? null;
  const [form, setForm] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ws && !form) setForm(wsToEdit(ws));
  }, [ws]);

  const set = (k: keyof EditState, v: string) =>
    setForm(prev => prev ? { ...prev, [k]: v } : prev);

  const wsClinics = clinics.filter(c => c.customer_id === id);
  const plan = saPlans.find(p => p.slug === ws?.plan);

  const handleSave = async () => {
    if (!id || !form) return;
    setSaving(true);
    const { error } = await update(id, {
      client_name: form.client_name.trim(),
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      document: form.document.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip_code: form.zip_code.trim() || null,
      notes: form.notes.trim() || null,
      plan: form.plan,
      status: form.status,
      license_type: form.license_type,
      valid_until: form.license_type === "anual" && form.valid_until ? form.valid_until : null,
    });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Workspace atualizado!");
  };

  if (wsLoading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );

  if (!ws || !form) return (
    <div className="p-6 text-center text-muted-foreground">
      <p className="text-sm">Workspace não encontrado.</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/workspaces")}>
        Voltar
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => navigate("/workspaces")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{ws.client_name}</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {plan?.name ?? ws.plan} · {ws.contact_email ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full"
            style={{ background: `${statusColor[ws.status] ?? "#888"}18`, color: statusColor[ws.status] ?? "#888" }}>
            {ws.status}
          </span>
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Dados do workspace */}
        <Section title="Dados do workspace">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input value={form.client_name} onChange={e => set("client_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CPF / CNPJ</Label>
              <Input value={form.document} onChange={e => set("document", e.target.value)} />
            </div>
          </div>
        </Section>

        {/* Contrato & plano */}
        <Section title="Contrato & plano">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Plano</Label>
              <Select value={form.plan} onValueChange={v => set("plan", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {saPlans.map(p => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {p.name} — R$ {p.price_monthly.toLocaleString("pt-BR")}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v as WorkspaceCustomer["status"])}>
                <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["trial","ativo","expirando","inadimplente","suspenso","cancelado"].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de licença</Label>
              <Select value={form.license_type} onValueChange={v => set("license_type", v as "anual" | "vitalicia")}>
                <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="vitalicia">Vitalícia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.license_type === "anual" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Válido até</Label>
                <Input type="date" value={form.valid_until} onChange={e => set("valid_until", e.target.value)} />
              </div>
            )}
            <div className="rounded-xl bg-muted/30 p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">MRR deste workspace</p>
              <p className="text-xl font-semibold text-green-500">
                {form.status === "ativo"
                  ? `R$ ${(saPlans.find(p => p.slug === form.plan)?.price_monthly ?? 0).toLocaleString("pt-BR")}`
                  : "—"}
                <span className="text-xs text-muted-foreground font-normal">/mês</span>
              </p>
            </div>
          </div>
        </Section>

        {/* Endereço */}
        <Section title="Endereço">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Logradouro</Label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Cidade</Label>
                <Input value={form.city} onChange={e => set("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UF</Label>
                <Input maxLength={2} value={form.state} onChange={e => set("state", e.target.value.toUpperCase())} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CEP</Label>
              <Input value={form.zip_code} onChange={e => set("zip_code", e.target.value)} />
            </div>
          </div>
        </Section>

        {/* Notas */}
        <Section title="Notas internas">
          <textarea
            rows={6}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
            placeholder="Observações, histórico, detalhes do contrato..."
          />
        </Section>
      </div>

      {/* Clínicas */}
      <Section title={`Clínicas (${wsClinics.length})`}>
        {wsClinics.length === 0 ? (
          <p className="text-sm text-muted-foreground/50 py-4 text-center">Nenhuma clínica cadastrada neste workspace</p>
        ) : (
          <div className="rounded-xl border border-border/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  {["Clínica", "Subdomínio", "Plano", "Status"].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wsClinics.map((c, i) => (
                  <tr key={c.id} className={`border-b border-border/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="py-2.5 px-4 font-medium">{c.name}</td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{c.subdomain}.bellex.beauty</td>
                    <td className="py-2.5 px-4 text-muted-foreground capitalize text-xs">{c.plan}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-full"
                        style={{ background: `${statusColor[c.status] ?? "#888"}18`, color: statusColor[c.status] ?? "#888" }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

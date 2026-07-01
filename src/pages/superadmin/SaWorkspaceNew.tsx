import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSaWorkspaces } from "@/hooks/useSaWorkspaces";
import { useSaPlans } from "@/hooks/useSaPlans";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, Building2, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { maskPhone, maskCPFCNPJ, validatePhone, validateCPFCNPJ } from "@/lib/masks";

type Form = {
  client_name: string;
  contact_email: string;
  contact_phone: string;
  document: string;
  plan: string;
  license_type: "anual" | "vitalicia";
  valid_until: string;
};

const EMPTY: Form = {
  client_name: "",
  contact_email: "",
  contact_phone: "",
  document: "",
  plan: "",
  license_type: "anual",
  valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
};

const STEPS = [
  { id: 1, label: "Dados", icon: Building2 },
  { id: 2, label: "Contrato", icon: FileText },
  { id: 3, label: "Confirmar", icon: CheckCircle2 },
];

type Errors = Partial<Record<keyof Form, string>>;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-destructive mt-1">{msg}</p>;
}

export default function SaWorkspaceNew() {
  const navigate = useNavigate();
  const { create } = useSaWorkspaces();
  const { plans } = useSaPlans();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Form, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  const validateStep1 = (): boolean => {
    const e: Errors = {};
    if (!form.client_name.trim()) e.client_name = "Nome do workspace é obrigatório";
    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email))
      e.contact_email = "E-mail inválido";
    if (form.contact_phone && !validatePhone(form.contact_phone))
      e.contact_phone = "Telefone inválido — mínimo 10 dígitos";
    if (form.document && !validateCPFCNPJ(form.document))
      e.document = "CPF ou CNPJ inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Errors = {};
    if (!form.plan) e.plan = "Selecione um plano";
    if (form.license_type === "anual" && !form.valid_until) e.valid_until = "Informe a data de validade";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep(s => s + 1);
  };

  const selectedPlan = plans.find(p => p.slug === form.plan);

  const handleCreate = async () => {
    setSaving(true);
    const { error } = await create({
      client_name: form.client_name.trim(),
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      plan: form.plan,
      seats_total: 1,
      license_type: form.license_type,
      valid_until: form.license_type === "anual" ? form.valid_until : null,
    });
    setSaving(false);
    if (error) { toast.error("Erro ao criar workspace"); return; }
    toast.success(`Workspace "${form.client_name}" criado!`);
    navigate("/workspaces");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => navigate("/workspaces")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Novo workspace</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Preencha os dados para criar um novo workspace na plataforma</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                  ${done ? "bg-primary border-primary text-primary-foreground" :
                    active ? "border-primary text-primary bg-primary/10" :
                    "border-border text-muted-foreground"}`}>
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[11px] font-medium ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 mb-5 transition-all ${done ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-5">
        {step === 1 && (
          <>
            <div>
              <p className="text-sm font-semibold mb-0.5">Dados do responsável</p>
              <p className="text-[12px] text-muted-foreground">Informações de contato do dono do workspace</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome do workspace *</Label>
                <Input
                  placeholder="ex: Clínica Silva"
                  value={form.client_name}
                  onChange={e => set("client_name", e.target.value)}
                  className={errors.client_name ? "border-destructive" : ""}
                  autoFocus
                />
                <FieldError msg={errors.client_name} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>E-mail de contato</Label>
                  <Input
                    type="email"
                    placeholder="email@empresa.com"
                    value={form.contact_email}
                    onChange={e => set("contact_email", e.target.value)}
                    className={errors.contact_email ? "border-destructive" : ""}
                  />
                  <FieldError msg={errors.contact_email} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={form.contact_phone}
                    onChange={e => set("contact_phone", maskPhone(e.target.value))}
                    className={errors.contact_phone ? "border-destructive" : ""}
                  />
                  <FieldError msg={errors.contact_phone} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>CPF / CNPJ</Label>
                <Input
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  value={form.document}
                  onChange={e => set("document", maskCPFCNPJ(e.target.value))}
                  className={errors.document ? "border-destructive" : ""}
                />
                <FieldError msg={errors.document} />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <p className="text-sm font-semibold mb-0.5">Contrato & plano</p>
              <p className="text-[12px] text-muted-foreground">Defina o plano e o tipo de licença</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Plano *</Label>
                <Select value={form.plan} onValueChange={v => set("plan", v)}>
                  <SelectTrigger className={errors.plan ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map(p => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.name} — R$ {p.price_monthly.toLocaleString("pt-BR")}/mês
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={errors.plan} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de licença *</Label>
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
                  <Label>Válido até *</Label>
                  <Input
                    type="date"
                    value={form.valid_until}
                    onChange={e => set("valid_until", e.target.value)}
                    className={errors.valid_until ? "border-destructive" : ""}
                  />
                  <FieldError msg={errors.valid_until} />
                </div>
              )}
              {selectedPlan && (
                <div className="rounded-xl bg-muted/30 p-4 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Resumo do plano selecionado</p>
                  <p className="text-base font-semibold">{selectedPlan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {selectedPlan.price_monthly.toLocaleString("pt-BR")}/mês · {selectedPlan.storage_gb} GB storage · {selectedPlan.ai_conversations_month} conv. IA/mês
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <p className="text-sm font-semibold mb-0.5">Confirmar criação</p>
              <p className="text-[12px] text-muted-foreground">Revise os dados antes de criar o workspace</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-border/30 divide-y divide-border/20 overflow-hidden">
                {[
                  { label: "Nome", value: form.client_name },
                  { label: "E-mail", value: form.contact_email || "—" },
                  { label: "Telefone", value: form.contact_phone || "—" },
                  { label: "CPF / CNPJ", value: form.document || "—" },
                  { label: "Plano", value: selectedPlan ? `${selectedPlan.name} — R$ ${selectedPlan.price_monthly.toLocaleString("pt-BR")}/mês` : "—" },
                  { label: "Licença", value: form.license_type === "anual" ? `Anual · válido até ${new Date(form.valid_until).toLocaleDateString("pt-BR")}` : "Vitalícia" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground text-[12px]">{label}</span>
                    <span className="font-medium text-[13px]">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground px-1">
                O workspace será criado com status <strong>trial</strong>. Mude para <strong>ativo</strong> após confirmação de pagamento.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/workspaces")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {step === 1 ? "Cancelar" : "Voltar"}
        </Button>

        {step < 3 ? (
          <Button onClick={handleNext}>
            Próximo
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
            Criar workspace
          </Button>
        )}
      </div>
    </div>
  );
}

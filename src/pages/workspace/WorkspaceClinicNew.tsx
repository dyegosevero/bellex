import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, Check, ArrowLeft, User, Globe, Palette, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";

const CLIENTES = [
  "Carla Mendonça",
  "Roberto Alves",
  "Patrícia Souza",
  "Marcos Vieira",
  "Ana Costa",
  "Fernanda Lima",
];

const PLANOS = [
  { id: "starter", name: "Starter", price: "R$ 297/mês", seats: "1 clínica", features: ["Agenda", "Clientes", "Financeiro básico"] },
  { id: "pro", name: "Pro", price: "R$ 597/mês", seats: "Até 3 clínicas", features: ["Tudo do Starter", "Pipeline", "Marketing", "Mensagens"] },
  { id: "enterprise", name: "Enterprise", price: "R$ 1.197/mês", seats: "Ilimitado", features: ["Tudo do Pro", "API access", "Domínio personalizado", "SLA dedicado"] },
];

const PRESET_COLORS = ["#e8957a", "#f5c87a", "#a78bfa", "#60a5fa", "#34d399", "#fb923c", "#f472b6", "#818cf8"];

const STEPS = [
  { id: 1, label: "Cliente", icon: User },
  { id: 2, label: "Identidade", icon: Palette },
  { id: 3, label: "Plano", icon: CreditCard },
  { id: 4, label: "Revisão", icon: Check },
];

export default function WorkspaceClinicNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    client: "",
    name: "",
    subdomain: "",
    color: "#e8957a",
    plan: "pro",
  });
  const { create } = useWorkspaceClinics();

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 1) return form.client !== "" && form.name !== "";
    if (step === 2) return form.subdomain !== "";
    if (step === 3) return form.plan !== "";
    return true;
  };

  const handleCreate = async () => {
    setSubmitting(true);
    const { error } = await create({
      name: form.name,
      client_name: form.client,
      subdomain: form.subdomain,
      custom_domain: null,
      color: form.color,
      plan: form.plan as "starter" | "pro" | "scale",
      status: "trial",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.includes("unique") ? "Subdomínio já existe. Escolha outro." : "Erro ao criar clínica.");
    } else {
      toast.success("Clínica criada com sucesso!");
      navigate("/workspace/clinicas");
    }
  };

  const selectedPlan = PLANOS.find(p => p.id === form.plan)!;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate("/workspace/clinicas")}>
          <ArrowLeft className="w-4 h-4" /> Clínicas
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">Nova clínica</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* Step indicators */}
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    done && "bg-primary text-primary-foreground",
                    active && "bg-primary/10 text-primary border-2 border-primary",
                    !done && !active && "bg-muted text-muted-foreground"
                  )}>
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn("text-xs font-medium", active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-px mx-3 mb-5 transition-colors", done ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="space-y-6">
          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-semibold">Dados do cliente</h2>
                <p className="text-sm text-muted-foreground mt-1">Selecione o cliente titular e defina o nome da clínica.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Cliente titular <span className="text-destructive">*</span></Label>
                  <Select value={form.client} onValueChange={v => set("client", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {CLIENTES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">O cliente deve ter uma licença ativa com seats disponíveis.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Nome da clínica <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Ex: Studio Bella Premium"
                    value={form.name}
                    onChange={e => {
                      set("name", e.target.value);
                      if (!form.subdomain) {
                        set("subdomain", e.target.value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "").slice(0, 24));
                      }
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="text-xl font-semibold">Identidade visual</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure o subdomínio e a cor principal da clínica.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Subdomínio <span className="text-destructive">*</span></Label>
                  <div className="flex items-center">
                    <Input
                      value={form.subdomain}
                      onChange={e => set("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="minhaclinica"
                      className="rounded-r-none"
                    />
                    <span className="h-9 px-3 bg-muted border border-l-0 border-input rounded-r-md text-xs text-muted-foreground flex items-center whitespace-nowrap">.bellex.app</span>
                  </div>
                  {form.subdomain && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span className="font-mono">{form.subdomain}.bellex.app</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Cor principal</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        className={cn("w-8 h-8 rounded-lg border-2 transition-all", form.color === c ? "border-foreground scale-110" : "border-transparent")}
                        style={{ background: c }}
                        onClick={() => set("color", c)}
                      />
                    ))}
                    <div className="flex items-center gap-2 ml-1">
                      <input
                        type="color"
                        value={form.color}
                        onChange={e => set("color", e.target.value)}
                        className="w-8 h-8 rounded-lg border border-input cursor-pointer"
                      />
                      <Input value={form.color} onChange={e => set("color", e.target.value)} className="w-28 font-mono text-xs h-8" />
                    </div>
                  </div>
                </div>

                {/* Preview card */}
                <div className="rounded-2xl border border-border/40 overflow-hidden w-64 shadow-sm">
                  <div className="h-2" style={{ background: form.color }} />
                  <div className="p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: form.color }}>
                      {(form.name || "C")[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{form.name || "Nome da clínica"}</p>
                      <p className="text-[10px] text-muted-foreground">{form.subdomain ? `${form.subdomain}.bellex.app` : "subdominio.bellex.app"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h2 className="text-xl font-semibold">Plano e licença</h2>
                <p className="text-sm text-muted-foreground mt-1">Escolha o plano da clínica. Isso afeta os módulos disponíveis.</p>
              </div>
              <div className="space-y-3">
                {PLANOS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => set("plan", p.id)}
                    className={cn(
                      "w-full text-left rounded-xl border-2 p-4 transition-all",
                      form.plan === p.id ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{p.name}</span>
                        {p.id === "pro" && <Badge className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20">Popular</Badge>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{p.seats}</span>
                        <span className="text-sm font-semibold">{p.price}</span>
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", form.plan === p.id ? "border-primary" : "border-muted-foreground/40")}>
                          {form.plan === p.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                    </div>
                    <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {p.features.map(f => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-500" />{f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <h2 className="text-xl font-semibold">Revisão</h2>
                <p className="text-sm text-muted-foreground mt-1">Confirme os dados antes de criar a clínica.</p>
              </div>
              <div className="rounded-2xl border border-border/40 overflow-hidden">
                <div className="h-2" style={{ background: form.color }} />
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: form.color }}>
                      {form.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{form.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{form.subdomain}.bellex.app</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Cliente titular</p>
                      <p className="font-medium">{form.client}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Plano</p>
                      <p className="font-medium">{selectedPlan.name} — {selectedPlan.price}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Subdomínio</p>
                      <p className="font-medium font-mono text-xs">{form.subdomain}.bellex.app</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Cor principal</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded" style={{ background: form.color }} />
                        <p className="font-medium font-mono text-xs">{form.color}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-border/40">
                    <p className="text-xs text-muted-foreground">
                      Após criar, a clínica estará disponível em <span className="font-mono font-medium">{form.subdomain}.bellex.app</span> e consumirá 1 seat da licença de {form.client}.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <Button
            variant="ghost"
            onClick={() => step === 1 ? navigate("/workspace/clinicas") : setStep(s => s - 1)}
          >
            {step === 1 ? "Cancelar" : "Voltar"}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Passo {step} de {STEPS.length}</span>
            {step < 4 ? (
              <Button disabled={!canNext()} onClick={() => setStep(s => s + 1)} className="gap-1.5">
                Próximo <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={submitting} className="gap-1.5">
                <Building2 className="w-4 h-4" /> {submitting ? "Criando..." : "Criar clínica"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

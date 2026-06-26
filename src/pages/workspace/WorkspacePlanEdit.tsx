import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Loader2, CreditCard, Zap, HardDrive,
  Building2, Calendar, ShoppingCart, BarChart2, MessageSquare,
  Megaphone, Globe, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWorkspacePlans } from "@/hooks/useWorkspacePlans";
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace";

// Catálogo canônico de features do plano de clínica
const FEATURES = [
  {
    key: "agenda",
    label: "Agenda & Atendimentos",
    desc: "Calendário, sessões de atendimento, histórico clínico",
    icon: Calendar,
    required: true,
  },
  {
    key: "agendamento_publico",
    label: "Agendamento online público",
    desc: "Link público para clientes agendarem sem login",
    icon: Globe,
    required: false,
  },
  {
    key: "cobrancas",
    label: "Cobranças & Faturamento",
    desc: "Emissão de cobranças, controle de caixa, faturamento",
    icon: ShoppingCart,
    required: true,
  },
  {
    key: "pipeline",
    label: "Pipeline de Vendas (CRM)",
    desc: "Kanban de leads, funil de conversão",
    icon: BarChart2,
    required: false,
  },
  {
    key: "mensagens",
    label: "Mensagens Omnichannel",
    desc: "WhatsApp e Instagram integrados via agente IA",
    icon: MessageSquare,
    required: false,
  },
  {
    key: "marketing",
    label: "Marketing & Campanhas",
    desc: "E-mail marketing, campanhas, pesquisa de avaliação",
    icon: Megaphone,
    required: false,
  },
];

const COLORS = ["#e8957a", "#60a5fa", "#a78bfa", "#34d399", "#f59e0b", "#f43f5e", "#0ea5e9", "#8b5cf6"];

function featuresFromArray(arr: string[]): Record<string, boolean> {
  const base: Record<string, boolean> = {};
  FEATURES.forEach(f => { base[f.key] = f.required; });
  arr.forEach(k => { if (k in base) base[k] = true; });
  return base;
}

function featuresToArray(map: Record<string, boolean>): string[] {
  return Object.entries(map).filter(([, v]) => v).map(([k]) => k);
}

export default function WorkspacePlanEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workspace } = useCurrentWorkspace();
  const { plans, loading, create, update } = useWorkspacePlans(workspace?.id ?? undefined);

  const isNew = id === "novo";
  const plan = isNew ? null : plans.find(p => p.id === id);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [seatsLimit, setSeatsLimit] = useState("1");
  const [aiConv, setAiConv] = useState("250");
  const [storageGb, setStorageGb] = useState("10");
  const [color, setColor] = useState("#e8957a");
  const [popular, setPopular] = useState(false);
  const [active, setActive] = useState(true);
  const [features, setFeatures] = useState<Record<string, boolean>>(() =>
    featuresFromArray([])
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setPrice(String(plan.price));
      setSeatsLimit(String(plan.seats_limit));
      setAiConv(String(plan.ai_conversations_month ?? 250));
      setStorageGb(String(plan.storage_gb ?? 10));
      setColor(plan.color);
      setPopular(plan.popular);
      setActive(plan.active);
      setFeatures(featuresFromArray(plan.features));
    }
  }, [plan]);

  if (!isNew && loading) return (
    <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
    </div>
  );

  if (!isNew && !loading && !plan) return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
      <CreditCard className="w-10 h-10 opacity-20" />
      <p className="text-sm">Plano não encontrado.</p>
      <Button size="sm" variant="outline" onClick={() => navigate("/planos")}>Voltar</Button>
    </div>
  );

  const handleSave = async () => {
    if (!name.trim() || !price) { toast.error("Nome e preço são obrigatórios"); return; }
    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
      price: parseFloat(price),
      seats_limit: parseInt(seatsLimit) || 1,
      ai_conversations_month: parseInt(aiConv) || 250,
      storage_gb: parseInt(storageGb) || 10,
      color,
      popular,
      active,
      features: featuresToArray(features),
      customer_id: workspace?.id ?? null,
      sort_order: plans.length + 1,
    };
    const ok = isNew ? await create(payload) : await update(id!, payload);
    setSaving(false);
    if (ok) navigate("/planos");
    // hook already shows toast on success/error
  };

  const toggleFeature = (key: string, val: boolean) =>
    setFeatures(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <div className="border-b border-border/40 px-6 py-4 flex items-center gap-4 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate("/planos")}>
          <ArrowLeft className="w-4 h-4" /> Planos
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{isNew ? "Novo plano" : name || "Editar plano"}</span>
        <Button size="sm" className="ml-auto gap-1.5" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar plano"}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">

        {/* Coluna principal */}
        <div className="col-span-2 space-y-6">

          {/* Identificação */}
          <section className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <p className="text-sm font-semibold">Identificação</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome do plano <span className="text-destructive">*</span></Label>
                <Input placeholder="Ex: Pro" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Preço / mês (R$) <span className="text-destructive">*</span></Label>
                <Input type="number" min={0} placeholder="500" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cor do plano</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-input cursor-pointer"
                  title="Cor personalizada"
                />
                <span className="text-xs font-mono text-muted-foreground">{color}</span>
              </div>
            </div>
          </section>

          {/* Limites */}
          <section className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <p className="text-sm font-semibold">Limites do plano</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Clínicas (seats)
                </Label>
                <Input type="number" min={1} value={seatsLimit} onChange={e => setSeatsLimit(e.target.value)} />
                <p className="text-xs text-muted-foreground">Máx. de clínicas por cliente</p>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" /> Conv. IA / mês
                </Label>
                <Input type="number" min={0} value={aiConv} onChange={e => setAiConv(e.target.value)} />
                <p className="text-xs text-muted-foreground">Atendimentos via agente</p>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-muted-foreground" /> Storage (GB)
                </Label>
                <Input type="number" min={1} value={storageGb} onChange={e => setStorageGb(e.target.value)} />
                <p className="text-xs text-muted-foreground">Arquivos e mídia</p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold">Módulos inclusos no plano</p>
              <p className="text-xs text-muted-foreground mt-0.5">Defina quais funcionalidades estarão disponíveis para clínicas neste plano.</p>
            </div>
            <div className="divide-y divide-border/30">
              {FEATURES.map(f => {
                const Icon = f.icon;
                const enabled = features[f.key] ?? f.required;
                return (
                  <div key={f.key} className="flex items-center gap-4 py-4">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-medium", !enabled && "text-muted-foreground")}>{f.label}</p>
                        {f.required && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">Obrigatório</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    </div>
                    <Switch
                      checked={enabled}
                      disabled={f.required}
                      onCheckedChange={v => toggleFeature(f.key, v)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar — preview + opções */}
        <div className="space-y-4">

          {/* Preview do card */}
          <section className="rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="h-1.5" style={{ background: color }} />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-base">{name || "Nome do plano"}</p>
                {popular && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-semibold">Popular</span>}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  R$ {parseFloat(price || "0").toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <span className="text-xs text-muted-foreground">🏥 {seatsLimit} clínica{parseInt(seatsLimit) !== 1 ? "s" : ""}</span>
                <span className="text-xs text-muted-foreground">🤖 {aiConv} conv./mês</span>
                <span className="text-xs text-muted-foreground">💾 {storageGb} GB</span>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-border/30">
                {FEATURES.filter(f => features[f.key]).map(f => (
                  <div key={f.key} className="flex items-center gap-1.5 text-xs">
                    <Check className="w-3 h-3 shrink-0" style={{ color }} />
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Opções */}
          <section className="rounded-2xl border border-border/40 bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Opções</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Destacar como popular</p>
                <p className="text-xs text-muted-foreground">Exibe badge "Mais popular"</p>
              </div>
              <Switch checked={popular} onCheckedChange={setPopular} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Plano ativo</p>
                <p className="text-xs text-muted-foreground">Visível para novas clínicas</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

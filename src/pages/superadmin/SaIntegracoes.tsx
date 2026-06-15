import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Plug, Eye, EyeOff, Check, ChevronRight, Search,
  Database, Mail, Zap, Bot, HardDrive, MessageSquare, Workflow, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IntegField = { key: string; label: string; placeholder?: string; secret?: boolean; type?: string };
type Integration = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  fields: IntegField[];
  badge?: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "supabase",
    name: "Supabase",
    description: "Banco de dados e autenticação do tenant.",
    icon: Database,
    color: "#3ecf8e",
    fields: [
      { key: "url", label: "Project URL", placeholder: "https://xxx.supabase.co" },
      { key: "anon_key", label: "Anon Key (pública)", placeholder: "eyJhbGci…", secret: true },
      { key: "service_role_key", label: "Service Role Key", placeholder: "eyJhbGci…", secret: true },
    ],
  },
  {
    id: "evolution",
    name: "EvolutionAPI",
    description: "Instância WhatsApp do tenant para mensagens e agentes IA.",
    icon: MessageSquare,
    color: "#25d366",
    fields: [
      { key: "base_url", label: "Base URL", placeholder: "https://evo.seudominio.com" },
      { key: "api_key", label: "API Key", placeholder: "B6D-xxxx", secret: true },
      { key: "instance_name", label: "Nome da instância", placeholder: "bellex-clinica" },
    ],
  },
  {
    id: "n8n",
    name: "n8n",
    description: "Automações e cache de DataTables para agentes IA.",
    icon: Workflow,
    color: "#ff6d5a",
    fields: [
      { key: "base_url", label: "Base URL", placeholder: "https://n8n.seudominio.com" },
      { key: "api_key", label: "API Key", placeholder: "n8n_api_xxxx", secret: true },
      { key: "webhook_url", label: "Webhook URL (DataTable sync)", placeholder: "https://n8n…/webhook/xxx" },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    description: "Envio de e-mails transacionais (confirmações, lembretes).",
    icon: Mail,
    color: "#e8957a",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "re_xxxx", secret: true },
      { key: "from_email", label: "E-mail remetente", placeholder: "noreply@clinica.com.br" },
      { key: "from_name", label: "Nome remetente", placeholder: "Clínica Bellex" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI / Claude",
    description: "Modelo de IA para agentes de atendimento.",
    icon: Bot,
    color: "#a78bfa",
    fields: [
      { key: "provider", label: "Provedor", placeholder: "openai | anthropic" },
      { key: "api_key", label: "API Key", placeholder: "sk-xxxx ou sk-ant-xxxx", secret: true },
      { key: "model", label: "Modelo padrão", placeholder: "gpt-4o / claude-sonnet-4-5" },
    ],
  },
  {
    id: "r2",
    name: "Cloudflare R2",
    description: "Storage de fotos, documentos e fichas do tenant.",
    icon: HardDrive,
    color: "#f38020",
    fields: [
      { key: "account_id", label: "Account ID", placeholder: "abc123" },
      { key: "access_key", label: "Access Key ID", placeholder: "xxxx", secret: true },
      { key: "secret_key", label: "Secret Access Key", placeholder: "xxxx", secret: true },
      { key: "bucket_name", label: "Bucket Name", placeholder: "bellex-tenant-slug" },
      { key: "public_url", label: "URL pública (opcional)", placeholder: "https://cdn.clinica.com.br" },
    ],
  },
  {
    id: "meta",
    name: "Meta / WhatsApp Business",
    description: "API oficial Meta para verificação de webhook WhatsApp.",
    icon: Zap,
    color: "#1877f2",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "EAAxx…", secret: true },
      { key: "phone_number_id", label: "Phone Number ID", placeholder: "123456789" },
      { key: "webhook_verify_token", label: "Webhook Verify Token", placeholder: "bellex_verify_xxx", secret: true },
      { key: "app_secret", label: "App Secret", placeholder: "abc123", secret: true },
    ],
  },
];

const LS_KEY = (tenantId: string) => `sa_integrations_${tenantId}`;

type TenantKeys = Record<string, Record<string, string>>;

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-9 font-mono text-xs"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function IntegrationCard({
  integ, values, onChange, onSave,
}: {
  integ: Integration;
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onSave: () => void;
}) {
  const Icon = integ.icon;
  const filled = integ.fields.filter(f => values[f.key]?.trim()).length;
  const total = integ.fields.length;
  const isComplete = filled === total;
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(
      "rounded-2xl border bg-card overflow-hidden transition-shadow hover:shadow-sm",
      isComplete ? "border-border/40" : "border-border/30"
    )}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${integ.color}18` }}>
          <Icon className="w-4 h-4" style={{ color: integ.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{integ.name}</p>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Manual</Badge>
            {isComplete && <Check className="w-3.5 h-3.5 text-green-500" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{integ.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-xs font-medium", isComplete ? "text-green-600" : "text-muted-foreground")}>
            {filled}/{total}
          </span>
          <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-90")} />
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-0.5 bg-muted mx-4">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${total > 0 ? (filled / total) * 100 : 0}%`, background: integ.color }}
        />
      </div>

      {/* Fields */}
      {open && (
        <div className="p-4 pt-3 space-y-3 border-t border-border/20 mt-0.5">
          {integ.fields.map(f => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              {f.secret ? (
                <SecretInput
                  value={values[f.key] ?? ""}
                  onChange={v => onChange(f.key, v)}
                  placeholder={f.placeholder}
                />
              ) : (
                <Input
                  value={values[f.key] ?? ""}
                  onChange={e => onChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="text-xs"
                />
              )}
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-muted-foreground">Salvo localmente • integração automática em breve</p>
            <Button size="sm" onClick={onSave} className="gap-1.5 h-7 text-xs">
              <Save className="w-3 h-3" /> Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SaIntegracoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { licenses, loading } = useWorkspaceLicenses();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("tenant"));
  const [keys, setKeys] = useState<TenantKeys>({});

  const selectedLicense = licenses.find(l => l.id === selectedId);

  // Load saved keys from localStorage when tenant changes
  useEffect(() => {
    if (!selectedId) return;
    try {
      const saved = localStorage.getItem(LS_KEY(selectedId));
      if (saved) setKeys(JSON.parse(saved));
      else setKeys({});
    } catch { setKeys({}); }
  }, [selectedId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSearchParams({ tenant: id });
  };

  const handleChange = (integId: string, fieldKey: string, val: string) => {
    setKeys(prev => ({
      ...prev,
      [integId]: { ...(prev[integId] ?? {}), [fieldKey]: val },
    }));
  };

  const handleSave = (integId: string) => {
    if (!selectedId) return;
    try {
      const current = keys;
      localStorage.setItem(LS_KEY(selectedId), JSON.stringify(current));
      toast({ title: `${INTEGRATIONS.find(i => i.id === integId)?.name} salvo.` });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const filteredLicenses = licenses.filter(l =>
    l.client_name.toLowerCase().includes(search.toLowerCase())
  );

  const completedCount = (licId: string) => {
    try {
      const saved = localStorage.getItem(LS_KEY(licId));
      if (!saved) return 0;
      const data: TenantKeys = JSON.parse(saved);
      return INTEGRATIONS.filter(integ =>
        integ.fields.every(f => data[integ.id]?.[f.key]?.trim())
      ).length;
    } catch { return 0; }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader icon={<Plug className="w-5 h-5" />} title="Integrações" subtitle="Chaves de API por tenant — manual agora, automático em breve" />

      <div className="flex gap-5 mt-6 h-[calc(100vh-160px)]">
        {/* Tenant list */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Buscar tenant…" className="pl-9 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Carregando…</p>
            ) : filteredLicenses.map(l => {
              const done = completedCount(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleSelect(l.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl border transition-colors space-y-0.5",
                    selectedId === l.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/30 bg-card hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium truncate">{l.client_name}</p>
                    <span className={cn("text-[10px] font-medium", done === INTEGRATIONS.length ? "text-green-600" : "text-muted-foreground")}>
                      {done}/{INTEGRATIONS.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground capitalize">{l.plan} · {l.status}</p>
                  {/* mini progress */}
                  <div className="h-0.5 rounded-full bg-muted mt-1 overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(done / INTEGRATIONS.length) * 100}%` }} />
                  </div>
                </button>
              );
            })}
            {!loading && filteredLicenses.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum tenant.</p>
            )}
          </div>
        </div>

        {/* Integration cards */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
                <Plug className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Selecione um tenant para configurar as integrações.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-semibold">{selectedLicense?.client_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedLicense?.plan} · {selectedLicense?.status}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {INTEGRATIONS.filter(integ =>
                    integ.fields.every(f => keys[integ.id]?.[f.key]?.trim())
                  ).length}/{INTEGRATIONS.length} configuradas
                </Badge>
              </div>

              {INTEGRATIONS.map(integ => (
                <IntegrationCard
                  key={integ.id}
                  integ={integ}
                  values={keys[integ.id] ?? {}}
                  onChange={(fieldKey, val) => handleChange(integ.id, fieldKey, val)}
                  onSave={() => handleSave(integ.id)}
                />
              ))}

              <p className="text-[11px] text-muted-foreground text-center pt-2 pb-4">
                As chaves são salvas localmente no navegador agora. Em breve serão criptografadas no Supabase e aplicadas automaticamente ao provisionar cada tenant.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

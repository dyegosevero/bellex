import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, Globe, Users, Palette, Settings, Shield,
  Copy, CheckCircle2, Clock, XCircle, AlertTriangle, ExternalLink,
  RefreshCw, Pencil, Save, ToggleLeft, ToggleRight, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CLINICAS: Record<string, {
  id: number; name: string; client: string; slug: string;
  domain: string; customDomain: string | null; domainVerified: boolean;
  users: number; plan: string; status: string; color: string;
  created: string; logo: string | null;
  features: Record<string, boolean>;
}> = {
  "1": { id: 1, name: "Clínica Estela Beauty", client: "Carla Mendonça", slug: "estelabeauty", domain: "estelabeauty.bellex.app", customDomain: "www.estelabeauty.com.br", domainVerified: true, users: 12, plan: "Pro", status: "ativo", color: "#e8957a", created: "15/03/2024", logo: null, features: { agenda: true, cobrancas: true, pipeline: true, mensagens: true, marketing: true } },
  "2": { id: 2, name: "Studio Laser Gold", client: "Roberto Alves", slug: "studiolaser", domain: "studiolaser.bellex.app", customDomain: "studiolaser.com.br", domainVerified: false, users: 8, plan: "Starter", status: "ativo", color: "#f5c87a", created: "02/06/2024", logo: null, features: { agenda: true, cobrancas: true, pipeline: false, mensagens: false, marketing: false } },
  "3": { id: 3, name: "Belle Skin Care", client: "Patrícia Souza", slug: "belleskin", domain: "belleskin.bellex.app", customDomain: null, domainVerified: false, users: 5, plan: "Enterprise", status: "ativo", color: "#a78bfa", created: "10/01/2024", logo: null, features: { agenda: true, cobrancas: true, pipeline: true, mensagens: true, marketing: true } },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded hover:bg-muted transition-colors shrink-0" title="Copiar">
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

function DnsRow({ type, name, value, ttl }: { type: string; name: string; value: string; ttl?: string }) {
  return (
    <div className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 items-center py-2.5 px-3 rounded-lg bg-muted/30 border border-border/40 font-mono text-xs">
      <span className="font-semibold text-primary">{type}</span>
      <span className="truncate text-foreground">{name}</span>
      <span className="truncate text-muted-foreground">{value}</span>
      <div className="flex items-center gap-1">
        {ttl && <span className="text-muted-foreground/60 text-[10px]">{ttl}</span>}
        <CopyButton text={value} />
      </div>
    </div>
  );
}

export default function WorkspaceClinicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clinic = CLINICAS[id ?? "1"] ?? CLINICAS["1"];

  const [color, setColor] = useState(clinic.color);
  const [name, setName] = useState(clinic.name);
  const [customDomain, setCustomDomain] = useState(clinic.customDomain ?? "");
  const [domainVerified, setDomainVerified] = useState(clinic.domainVerified);
  const [verifying, setVerifying] = useState(false);
  const [features, setFeatures] = useState(clinic.features);

  const verifyToken = `bellex-verify=${clinic.slug}-a4f8c2e1b7d3`;
  const planSupportsCustomDomain = clinic.plan === "Enterprise" || clinic.plan === "Pro";

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      if (customDomain) {
        setDomainVerified(true);
        toast.success("Domínio verificado com sucesso!");
      } else {
        toast.error("Nenhum domínio configurado.");
      }
    }, 2500);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => navigate("/workspace/clinicas")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: clinic.color }}>
            {clinic.name[0]}
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">{clinic.name}</h1>
            <p className="text-xs text-muted-foreground">{clinic.client} · {clinic.plan} · <span className="text-green-600">{clinic.status}</span></p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={() => window.open(`https://${clinic.domain}`, "_blank")}>
          <ExternalLink className="w-3.5 h-3.5" /> Abrir painel
        </Button>
      </div>

      <Tabs defaultValue="geral">
        <TabsList className="w-full justify-start border-b border-border/40 rounded-none bg-transparent h-auto pb-0 gap-1">
          {[
            { value: "geral", icon: Building2, label: "Geral" },
            { value: "dominio", icon: Globe, label: "Domínio" },
            { value: "features", icon: ToggleLeft, label: "Features" },
            { value: "usuarios", icon: Users, label: "Usuários" },
            { value: "aparencia", icon: Palette, label: "Aparência" },
            { value: "avancado", icon: Settings, label: "Avançado" },
          ].map(t => (
            <TabsTrigger
              key={t.value} value={t.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 px-3 pb-2.5 text-xs"
            >
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── GERAL ── */}
        <TabsContent value="geral" className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <p className="text-sm font-medium">Informações da clínica</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome da clínica</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug / subdomínio</Label>
                <div className="flex items-center">
                  <Input value={clinic.slug} readOnly className="rounded-r-none bg-muted/40" />
                  <span className="h-9 px-3 bg-muted border border-l-0 border-input rounded-r-md text-xs text-muted-foreground flex items-center">.bellex.app</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente titular</Label>
                <Input value={clinic.client} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Input value={clinic.plan} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Data de criação</Label>
                <Input value={clinic.created} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Input value={clinic.status} readOnly className="bg-muted/40 capitalize" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" className="gap-1.5"><Save className="w-3.5 h-3.5" />Salvar</Button>
            </div>
          </div>
        </TabsContent>

        {/* ── DOMÍNIO ── */}
        <TabsContent value="dominio" className="mt-6 space-y-4">

          {/* Domínio padrão */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
            <p className="text-sm font-medium">Domínio padrão Bellex</p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border/30">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-mono flex-1">{clinic.domain}</span>
              <CopyButton text={`https://${clinic.domain}`} />
              <a href={`https://${clinic.domain}`} target="_blank" rel="noreferrer">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">Este domínio sempre funciona, independente do domínio personalizado.</p>
          </div>

          {/* Domínio personalizado */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Domínio personalizado</p>
                <p className="text-xs text-muted-foreground mt-0.5">Aponte seu domínio para esta clínica</p>
              </div>
              {!planSupportsCustomDomain && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg">Requer Pro ou Enterprise</span>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="www.suaclinica.com.br"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
                disabled={!planSupportsCustomDomain}
                className="font-mono text-sm"
              />
              <Button
                variant="outline" size="sm"
                disabled={!planSupportsCustomDomain || verifying}
                onClick={handleVerify}
                className="gap-1.5 shrink-0"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", verifying && "animate-spin")} />
                {verifying ? "Verificando..." : "Verificar"}
              </Button>
            </div>

            {/* Status de verificação */}
            {customDomain && (
              <div className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl text-sm border",
                domainVerified
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              )}>
                {domainVerified
                  ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  : <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                }
                <span>
                  {domainVerified
                    ? `${customDomain} está verificado e ativo.`
                    : "Aguardando verificação DNS. Configure os registros abaixo e clique em Verificar."}
                </span>
              </div>
            )}
          </div>

          {/* Instruções DNS */}
          {planSupportsCustomDomain && (
            <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-5">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Configuração DNS</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Acesse o painel do seu provedor de DNS (Registro.br, Cloudflare, GoDaddy, etc.) e adicione os registros abaixo.
                  </p>
                </div>
              </div>

              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 px-3">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tipo</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Valor</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TTL</span>
              </div>

              {/* Passo 1 — TXT de verificação */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">1</span>
                  Verificação de propriedade (TXT)
                </p>
                <DnsRow
                  type="TXT"
                  name={`_bellex-verify${customDomain ? `.${customDomain.replace(/^www\./, "")}` : ""}`}
                  value={verifyToken}
                  ttl="300"
                />
                <p className="text-xs text-muted-foreground pl-7">
                  Comprova que você é dono do domínio. Pode ser removido após verificação.
                </p>
              </div>

              {/* Passo 2 — CNAME www */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">2</span>
                  Apontamento principal (CNAME)
                </p>
                <DnsRow
                  type="CNAME"
                  name="www"
                  value="proxy.bellex.app"
                  ttl="3600"
                />
                <p className="text-xs text-muted-foreground pl-7">
                  Aponta <code className="bg-muted px-1 rounded">www.seudominio.com.br</code> para o servidor Bellex.
                </p>
              </div>

              {/* Passo 3 — Redirect apex (opcional) */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center">3</span>
                  Redirect de domínio raiz — opcional (A Record)
                </p>
                <DnsRow type="A" name="@" value="76.76.21.21" ttl="3600" />
                <p className="text-xs text-muted-foreground pl-7">
                  Redireciona <code className="bg-muted px-1 rounded">seudominio.com.br</code> (sem www) para o www. Alguns provedores não suportam CNAME no apex — use este A Record.
                </p>
              </div>

              {/* Aviso de propagação */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
                <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Propagação de DNS pode levar até 48h</p>
                  <p>Normalmente leva entre 5 minutos e 2 horas. Após adicionar os registros, clique em <strong>Verificar</strong> acima.</p>
                </div>
              </div>

              {/* SSL */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                <Shield className="w-4 h-4 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-green-800">SSL/HTTPS automático</p>
                  <p className="text-xs text-green-700">Certificado Let's Encrypt gerado automaticamente após verificação do domínio.</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── FEATURES ── */}
        <TabsContent value="features" className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <p className="text-sm font-medium">Módulos ativos nesta clínica</p>
            <p className="text-xs text-muted-foreground">Controle quais funcionalidades estão disponíveis para os usuários desta instalação.</p>
            <div className="space-y-1 divide-y divide-border/30">
              {[
                { key: "agenda", label: "Agenda & Atendimentos", desc: "Calendário, agendamento online, sessões", required: true },
                { key: "cobrancas", label: "Cobranças & Faturamento", desc: "Emissão de cobranças, faturamento mensal", required: true },
                { key: "pipeline", label: "Pipeline de Vendas (CRM)", desc: "Kanban de leads, conversões", required: false },
                { key: "mensagens", label: "Mensagens Omnichannel", desc: "WhatsApp, Instagram integrados", required: false },
                { key: "marketing", label: "Marketing & Campanhas", desc: "E-mail marketing, avaliações", required: false },
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                  <Switch
                    checked={features[f.key] ?? false}
                    disabled={f.required}
                    onCheckedChange={v => setFeatures(prev => ({ ...prev, [f.key]: v }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" className="gap-1.5"><Save className="w-3.5 h-3.5" />Salvar</Button>
            </div>
          </div>
        </TabsContent>

        {/* ── USUÁRIOS ── */}
        <TabsContent value="usuarios" className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Usuários desta clínica</p>
              <span className="text-xs text-muted-foreground">{clinic.users} usuários</span>
            </div>
            {[
              { name: "Carla Mendonça", email: "carla@estelabeauty.com.br", role: "admin", last: "hoje" },
              { name: "Julia Santos", email: "julia@estelabeauty.com.br", role: "especialista", last: "ontem" },
              { name: "Beatriz Ramos", email: "beatriz@estelabeauty.com.br", role: "atendimento", last: "hoje" },
            ].map(u => (
              <div key={u.email} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {u.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{u.role}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">{u.last}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => navigate("/workspace/usuarios")}>
              Ver todos os usuários →
            </Button>
          </div>
        </TabsContent>

        {/* ── APARÊNCIA ── */}
        <TabsContent value="aparencia" className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-5">
            <p className="text-sm font-medium">Identidade visual da clínica</p>
            <div className="space-y-1.5">
              <Label>Cor principal</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded-xl border border-input cursor-pointer" />
                <Input value={color} onChange={e => setColor(e.target.value)} className="w-32 font-mono text-sm" />
                <div className="w-10 h-10 rounded-xl border border-border" style={{ background: color }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <Building2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Clique para fazer upload ou arraste a imagem</p>
                <p className="text-xs text-muted-foreground/60 mt-1">PNG, SVG · máx. 2MB · recomendado 400×120px</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Favicon</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <p className="text-sm text-muted-foreground">Upload do favicon</p>
                <p className="text-xs text-muted-foreground/60 mt-1">ICO, PNG · 32×32px</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" className="gap-1.5"><Save className="w-3.5 h-3.5" />Salvar aparência</Button>
            </div>
          </div>
        </TabsContent>

        {/* ── AVANÇADO ── */}
        <TabsContent value="avancado" className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <p className="text-sm font-medium">Configurações avançadas</p>
            <div className="space-y-3 divide-y divide-border/30">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Agendamento online público</p>
                  <p className="text-xs text-muted-foreground">Permite que clientes agendem sem login</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Modo manutenção</p>
                  <p className="text-xs text-muted-foreground">Exibe página de manutenção para visitantes</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Logs de acesso</p>
                  <p className="text-xs text-muted-foreground">Registra todos os acessos ao painel</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          {/* Zona de perigo */}
          <div className="rounded-2xl border border-destructive/30 bg-card p-5 space-y-3">
            <p className="text-sm font-medium text-destructive">Zona de perigo</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                <div>
                  <p className="text-sm font-medium">Suspender clínica</p>
                  <p className="text-xs text-muted-foreground">Bloqueia acesso mas mantém dados</p>
                </div>
                <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/5">Suspender</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                <div>
                  <p className="text-sm font-medium">Excluir clínica</p>
                  <p className="text-xs text-muted-foreground">Ação irreversível — todos os dados serão removidos</p>
                </div>
                <Button variant="destructive" size="sm">Excluir</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

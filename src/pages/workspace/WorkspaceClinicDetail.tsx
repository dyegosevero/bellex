import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storage } from "@/lib/storage";
import {
  ArrowLeft, Building2, Globe, Users, Palette, Settings, Shield,
  Copy, CheckCircle2, Clock, XCircle, AlertTriangle, ExternalLink,
  RefreshCw, Pencil, Save, ToggleLeft, ToggleRight, Eye, EyeOff, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWorkspaceClinics, type WorkspaceClinic } from "@/hooks/useWorkspaceClinics";
import { supabase } from "@/integrations/supabase/client";

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
  const { clinics, loading: clinicsLoading, update } = useWorkspaceClinics();
  const clinic = clinics.find(c => c.id === id);

  const [color, setColor] = useState("#e8957a");
  const [name, setName] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [domainVerified, setDomainVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState<Record<string, boolean>>({ agenda: true, cobrancas: true, pipeline: false, mensagens: false, marketing: false });
  const [openaiKey, setOpenaiKey] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (clinic) {
      setColor(clinic.color);
      setName(clinic.name);
      setCustomDomain(clinic.custom_domain ?? "");
      setOpenaiKey((clinic as Record<string, unknown>).openai_api_key as string ?? "");
      setLogoUrl((clinic as Record<string, unknown>).logo_url as string ?? null);
    }
  }, [clinic]);

  const handleSave = async () => {
    if (!clinic) return;
    setSaving(true);
    const { error } = await update(clinic.id, {
      name,
      color,
      logo_url: logoUrl,
      custom_domain: customDomain || null,
      openai_api_key: openaiKey || null,
    } as Parameters<typeof update>[1]);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else toast.success("Alterações salvas!");
  };

  if (clinicsLoading) return (
    <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
    </div>
  );

  if (!clinic) return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
      <Building2 className="w-10 h-10 opacity-20" />
      <p className="text-sm">Clínica não encontrada.</p>
      <Button size="sm" variant="outline" onClick={() => navigate("/clinicas")}>Voltar</Button>
    </div>
  );

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.endsWith(".svg") && file.type !== "image/svg+xml") {
      toast.error("Apenas arquivos SVG são aceitos para o logo.");
      return;
    }
    setUploadingLogo(true);
    try {
      const path = `workspaces/${clinic.subdomain}/logo.svg`;
      const { error: upErr } = await storage.from("clinic-branding").upload(path, file, { upsert: true, contentType: "image/svg+xml" });
      if (upErr) throw upErr;
      const { data } = storage.from("clinic-branding").getPublicUrl(path);
      const url = data.publicUrl;
      setLogoUrl(url);
      await update(clinic.id, { logo_url: url } as Parameters<typeof update>[1]);
      toast.success("Logo atualizado!");
    } catch {
      toast.error("Erro ao enviar logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `workspaces/${clinic.subdomain}/favicon.${ext}`;
      const { error } = await storage.from("clinic-branding").upload(path, file);
      if (error) throw error;
      const { data } = storage.from("clinic-branding").getPublicUrl(path);
      setFaviconUrl(data.publicUrl);
      toast.success("Favicon atualizado!");
    } catch {
      toast.error("Erro ao enviar favicon.");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleInviteClinic = async () => {
    if (!clinic || !inviteEmail.includes("@")) return;
    setInviting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("invite-workspace-user", {
      body: {
        email: inviteEmail,
        role: "admin",
        workspace_url: `https://${clinic.subdomain}.bellex.beauty`,
      },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setInviting(false);
    if (res.error) { toast.error("Erro ao enviar convite"); return; }
    await update(clinic.id, { contact_email: inviteEmail } as any);
    setInviteEmail("");
    toast.success(`Convite enviado para ${inviteEmail}`);
  };

  const verifyToken = `bellex-verify=${clinic.subdomain}-a4f8c2e1b7d3`;
  const planSupportsCustomDomain = true;

  const handleVerify = async () => {
    if (!customDomain) { toast.error("Configure um domínio primeiro."); return; }
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("dns-verify", {
      body: {
        domain: customDomain,
        subdomain: clinic.subdomain,
        verify_token: `${clinic.subdomain}-a4f8c2e1b7d3`,
      },
    });
    setVerifying(false);
    if (error) { toast.error("Erro ao verificar DNS."); return; }
    if (data?.verified) {
      setDomainVerified(true);
      await update(clinic.id, { custom_domain: customDomain });
      toast.success("Domínio verificado e ativado!");
    } else {
      const missing = [];
      if (!data?.txt_verified) missing.push("TXT");
      if (!data?.cname_verified) missing.push("CNAME");
      toast.error(`DNS incompleto — faltam registros: ${missing.join(", ")}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => navigate("/clinicas")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: clinic.color }}>
            {clinic.name[0]}
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">{clinic.name}</h1>
            <p className="text-xs text-muted-foreground">{clinic.client_name} · {clinic.plan} · <span className="text-green-600">{clinic.status}</span></p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={() => window.open(`https://${clinic.subdomain + ".bellex.beauty"}`, "_blank")}>
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
                  <Input value={clinic.subdomain} readOnly className="rounded-r-none bg-muted/40" />
                  <span className="h-9 px-3 bg-muted border border-l-0 border-input rounded-r-md text-xs text-muted-foreground flex items-center">.bellex.beauty</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente titular</Label>
                <Input value={clinic.client_name} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Input value={clinic.plan} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Data de criação</Label>
                <Input value={new Date(clinic.created_at).toLocaleDateString("pt-BR")} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Input value={clinic.status} readOnly className="bg-muted/40 capitalize" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                <Save className="w-3.5 h-3.5" />{saving ? "Salvando..." : "Salvar"}
              </Button>
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
              <span className="text-sm font-mono flex-1">{clinic.subdomain + ".bellex.beauty"}</span>
              <CopyButton text={`https://${clinic.subdomain + ".bellex.beauty"}`} />
              <a href={`https://${clinic.subdomain + ".bellex.beauty"}`} target="_blank" rel="noreferrer">
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
                  value="proxy.bellex.beauty"
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
                <DnsRow type="A" name="@" value="76.13.225.174" ttl="3600" />
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
                { key: "agenda", label: "Agenda & Atendimentos", desc: "Calendário, sessões de atendimento", required: true },
                { key: "agendamento_publico", label: "Agendamento online público", desc: "Clientes agendam sem login via link público", required: false },
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
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <div>
              <p className="text-sm font-medium">Convidar administrador desta clínica</p>
              <p className="text-xs text-muted-foreground mt-1">
                O cliente receberá um e-mail com link de acesso ao painel em{" "}
                <span className="font-mono">{clinic.subdomain}.bellex.beauty</span>
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border/30 font-mono text-xs">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1">{clinic.subdomain}.bellex.beauty</span>
              <CopyButton text={`https://${clinic.subdomain}.bellex.beauty`} />
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="e-mail do administrador da clínica"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInviteClinic()}
                className="flex-1"
              />
              <Button
                onClick={handleInviteClinic}
                disabled={inviting || !inviteEmail.includes("@")}
                size="sm"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Convidar"}
              </Button>
            </div>
            {clinic.client_name && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/10">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {clinic.client_name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{clinic.client_name}</p>
                  <p className="text-xs text-muted-foreground">Titular da licença</p>
                </div>
              </div>
            )}
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
              <input
                ref={logoInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
              />
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => logoInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleLogoUpload(f); }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-12 mx-auto object-contain mb-2" />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                )}
                <p className="text-sm text-muted-foreground">
                  {uploadingLogo ? "Enviando..." : "Clique para fazer upload ou arraste a imagem"}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">SVG obrigatório · máx. 2MB · recomendado 400×120px</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Favicon</Label>
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/x-icon,image/png"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFaviconUpload(f); }}
              />
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => faviconInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFaviconUpload(f); }}
              >
                {faviconUrl ? (
                  <img src={faviconUrl} alt="Favicon" className="w-8 h-8 mx-auto mb-2 object-contain" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {uploadingFavicon ? "Enviando..." : "Upload do favicon"}
                  </p>
                )}
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
          {/* Chave OpenAI */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#10a37f] flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Chave OpenAI</p>
                <p className="text-xs text-muted-foreground">
                  {openaiKey ? "Usando chave própria desta clínica" : "Herdando chave do workspace"}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>API Key (opcional)</Label>
              <Input
                type="password"
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-... (deixe em branco para herdar do workspace)"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Se preenchida, esta clínica usa esta chave. Caso contrário, herda a chave do workspace.
              </p>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar chave"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <p className="text-sm font-medium">Configurações avançadas</p>
            <div className="space-y-3 divide-y divide-border/30">
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

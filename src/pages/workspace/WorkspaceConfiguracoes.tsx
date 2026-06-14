import { useState, useEffect } from "react";
import { Settings, Palette, Key, MessageSquare, Bot, Globe, Mail, Bell, Eye, EyeOff, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceSettings } from "@/hooks/useWorkspaceSettings";

function SecretInput({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-9 font-mono text-sm"
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

function StatusBadge({ status }: { status: "connected" | "disconnected" | "pending" }) {
  const map = {
    connected: { label: "Conectado", class: "bg-green-50 text-green-700 border-green-200" },
    disconnected: { label: "Não configurado", class: "bg-muted text-muted-foreground border-border" },
    pending: { label: "Pendente", class: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  };
  const s = map[status];
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.class}`}>{s.label}</span>;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const PRESET_COLORS = ["#e8957a", "#f5c87a", "#a78bfa", "#60a5fa", "#34d399", "#fb923c", "#f472b6", "#818cf8"];

export default function WorkspaceConfiguracoes() {
  const { toast } = useToast();
  const { settings, save: saveSettings, testResend } = useWorkspaceSettings();
  const [resendKey, setResendKey] = useState("");
  const [resendFrom, setResendFrom] = useState("noreply@bellex.app");
  const [wpToken, setWpToken] = useState("");
  const [wpPhone, setWpPhone] = useState("");
  const [brandColor, setBrandColor] = useState("#e8957a");
  const [workspaceName, setWorkspaceName] = useState("Meu Workspace");
  const [domain, setDomain] = useState("app.bellex.com.br");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [agentName, setAgentName] = useState("Assistente Bellex");
  const [agentPrompt, setAgentPrompt] = useState("Você é um assistente de suporte para clínicas que usam o sistema Bellex. Seja objetivo e amigável.");
  const [saving, setSaving] = useState(false);
  const [testingResend, setTestingResend] = useState(false);

  useEffect(() => {
    if (!settings) return;
    if (settings.resend_key) setResendKey(settings.resend_key);
    if (settings.resend_from) setResendFrom(settings.resend_from);
    if (settings.wp_token) setWpToken(settings.wp_token);
    if (settings.wp_phone_id) setWpPhone(settings.wp_phone_id);
    setBrandColor(settings.brand_color);
    setWorkspaceName(settings.workspace_name);
    setNotifyEmail(settings.notify_email);
    setNotifyWhatsapp(settings.notify_whatsapp);
    setAgentEnabled(settings.agent_enabled);
    setAgentName(settings.agent_name);
    if (settings.agent_prompt) setAgentPrompt(settings.agent_prompt);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    const { error } = await saveSettings({
      resend_key: resendKey || null,
      resend_from: resendFrom,
      wp_token: wpToken || null,
      wp_phone_id: wpPhone || null,
      brand_color: brandColor,
      workspace_name: workspaceName,
      notify_email: notifyEmail,
      notify_whatsapp: notifyWhatsapp,
      agent_enabled: agentEnabled,
      agent_name: agentName,
      agent_prompt: agentPrompt,
    });
    setSaving(false);
    if (error) toast({ title: "Erro ao salvar", description: error, variant: "destructive" });
    else toast({ title: "Configurações salvas", description: "As alterações foram aplicadas." });
  };

  const handleTestResend = async () => {
    if (!resendKey) return;
    setTestingResend(true);
    const result = await testResend(resendKey);
    setTestingResend(false);
    if (result.valid) toast({ title: "Resend conectado!", description: "Chave válida e pronta para uso." });
    else toast({ title: "Chave inválida", description: result.error ?? "Verifique a chave e tente novamente.", variant: "destructive" });
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <PageHeader icon={<Settings className="w-5 h-5" />} title="Configurações" subtitle="Workspace, integrações e identidade visual" />

      <Tabs defaultValue="workspace">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="workspace" className="gap-1.5 text-xs"><Globe className="w-3.5 h-3.5" />Workspace</TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-1.5 text-xs"><Key className="w-3.5 h-3.5" />Integrações</TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-1.5 text-xs"><Bell className="w-3.5 h-3.5" />Notificações</TabsTrigger>
          <TabsTrigger value="agente" className="gap-1.5 text-xs"><Bot className="w-3.5 h-3.5" />Agente IA</TabsTrigger>
        </TabsList>

        {/* WORKSPACE */}
        <TabsContent value="workspace" className="space-y-6 mt-6">
          <section className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm">Dados gerais</h3>
              <p className="text-xs text-muted-foreground">Informações básicas do seu workspace.</p>
            </div>
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label>Nome do workspace</Label>
                <Input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Domínio principal</Label>
                <div className="flex gap-2">
                  <Input value={domain} onChange={e => setDomain(e.target.value)} className="flex-1" />
                  <Button variant="outline" size="sm" className="shrink-0">Verificar</Button>
                </div>
                <p className="text-xs text-muted-foreground">Domínio onde o painel admin fica acessível.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-border/40">
            <div>
              <h3 className="font-semibold text-sm">Identidade visual</h3>
              <p className="text-xs text-muted-foreground">Cores e marca padrão aplicadas nas clínicas sem personalização própria.</p>
            </div>
            <div className="space-y-2">
              <Label>Cor primária padrão</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    className={cn("w-8 h-8 rounded-lg border-2 transition-all", brandColor === c ? "border-foreground scale-110" : "border-transparent")}
                    style={{ background: c }}
                    onClick={() => setBrandColor(c)}
                  />
                ))}
                <div className="flex items-center gap-2 ml-1">
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-8 h-8 rounded-lg border border-input cursor-pointer" />
                  <Input value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-28 font-mono text-xs h-8" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Logo do workspace</Label>
              <div className="border-2 border-dashed border-border/60 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors">
                <Palette className="w-6 h-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Arraste um arquivo PNG/SVG ou clique para selecionar</p>
                <p className="text-[10px] text-muted-foreground">Recomendado: 200×60px, fundo transparente</p>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button onClick={save} className="gap-1.5"><CheckCircle2 className="w-4 h-4" />Salvar alterações</Button>
          </div>
        </TabsContent>

        {/* INTEGRAÇÕES */}
        <TabsContent value="integracoes" className="space-y-6 mt-6">
          {/* Resend */}
          <section className="rounded-xl border border-border/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Resend</p>
                  <p className="text-xs text-muted-foreground">Envio de e-mails transacionais</p>
                </div>
              </div>
              <StatusBadge status={resendKey ? "connected" : "disconnected"} />
            </div>
            <div className="space-y-1.5">
              <Label>API Key</Label>
              <SecretInput value={resendKey} placeholder="re_xxxxxxxxxxxxxxxxxxxx" onChange={setResendKey} />
              <p className="text-xs text-muted-foreground">
                Encontre sua chave em <span className="font-mono">resend.com/api-keys</span>
              </p>
            </div>
            {resendKey && (
              <div className="space-y-1.5">
                <Label>From address padrão</Label>
                <Input value={resendFrom} onChange={e => setResendFrom(e.target.value)} className="font-mono text-sm" />
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={handleTestResend} disabled={!resendKey || testingResend}>
                {testingResend ? "Testando..." : "Testar conexão"}
              </Button>
            </div>
          </section>

          {/* WhatsApp */}
          <section className="rounded-xl border border-border/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#25D366] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">WhatsApp Business API</p>
                  <p className="text-xs text-muted-foreground">Notificações via WhatsApp para donos de clínicas</p>
                </div>
              </div>
              <StatusBadge status={wpToken ? "connected" : "disconnected"} />
            </div>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label>Access Token</Label>
                <SecretInput value={wpToken} placeholder="EAAxxxxxxxxxx..." onChange={setWpToken} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number ID</Label>
                <Input value={wpPhone} onChange={e => setWpPhone(e.target.value)} placeholder="1234567890" className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">ID do número no Meta Business Suite.</p>
              </div>
            </div>
            {wpToken && (
              <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
                <p className="text-xs font-medium">Webhook URL</p>
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground bg-background rounded-md px-3 py-2 border border-border/40">
                  <span className="flex-1 truncate">https://jrvkdekyupcxzbxtlnwu.supabase.co/functions/v1/whatsapp-webhook</span>
                  <CopyButton value="https://jrvkdekyupcxzbxtlnwu.supabase.co/functions/v1/whatsapp-webhook" />
                </div>
                <p className="text-[10px] text-muted-foreground">Configure este endpoint no Meta Developer Console → Webhooks.</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={save} disabled={saving}>
                {saving ? "Salvando..." : "Salvar credenciais"}
              </Button>
            </div>
          </section>

          <div className="flex justify-end">
            <Button onClick={save} className="gap-1.5"><CheckCircle2 className="w-4 h-4" />Salvar integrações</Button>
          </div>
        </TabsContent>

        {/* NOTIFICAÇÕES */}
        <TabsContent value="notificacoes" className="space-y-6 mt-6">
          <section className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm">Canais de notificação</h3>
              <p className="text-xs text-muted-foreground">Escolha como os donos de clínicas recebem alertas do sistema.</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "E-mail", desc: "Novos acessos, renovações de plano, alertas de cobrança", state: notifyEmail, set: setNotifyEmail, icon: Mail },
                { label: "WhatsApp", desc: "Alertas críticos em tempo real via WhatsApp Business API", state: notifyWhatsapp, set: setNotifyWhatsapp, icon: MessageSquare },
              ].map(({ label, desc, state, set: setter, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between p-4 rounded-xl border border-border/40">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Switch checked={state} onCheckedChange={setter} />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-border/40">
            <h3 className="font-semibold text-sm">Eventos notificáveis</h3>
            <div className="space-y-2">
              {[
                "Nova clínica criada",
                "Licença prestes a expirar (7 dias)",
                "Pagamento recebido",
                "Pagamento atrasado",
                "Clínica suspensa",
                "Usuário novo cadastrado",
                "Erro crítico de sistema",
              ].map(ev => (
                <label key={ev} className="flex items-center gap-3 text-sm cursor-pointer py-1">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary rounded" />
                  {ev}
                </label>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <Button onClick={save} className="gap-1.5"><CheckCircle2 className="w-4 h-4" />Salvar preferências</Button>
          </div>
        </TabsContent>

        {/* AGENTE IA */}
        <TabsContent value="agente" className="space-y-6 mt-6">
          <div className="rounded-xl border border-border/40 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Agente de suporte</p>
                  <p className="text-xs text-muted-foreground">Aparece nas clínicas como ícone [?] no canto da tela</p>
                </div>
              </div>
              <Switch checked={agentEnabled} onCheckedChange={setAgentEnabled} />
            </div>

            {agentEnabled && (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label>Nome do agente</Label>
                  <Input value={agentName} onChange={e => setAgentName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Prompt do sistema</Label>
                  <textarea
                    value={agentPrompt}
                    onChange={e => setAgentPrompt(e.target.value)}
                    rows={5}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">Define o comportamento do agente. Seja específico sobre o que ele deve e não deve responder.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Modelo</Label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border/40">
                    <Bot className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Claude claude-haiku-4-5</p>
                      <p className="text-xs text-muted-foreground">Rápido, econômico, ideal para suporte</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Padrão</Badge>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    <p className="font-medium">Disponível em breve</p>
                    <p>A integração do agente nas clínicas estará disponível na próxima sprint. O ícone [?] aparecerá no canto inferior direito de cada painel de clínica.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={!agentEnabled} className="gap-1.5"><CheckCircle2 className="w-4 h-4" />Salvar agente</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

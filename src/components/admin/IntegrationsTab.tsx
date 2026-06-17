import { useState, useEffect, useRef } from "react";
// HMR fix
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plug,
  Save,
  Copy,
  Check,
  Webhook,
  MessageSquare,
  Database,
  Loader2,
  Download,
  QrCode,
  RefreshCw,
  WifiOff,
  Wifi,
  Code2,
  History,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  Trash2,
  Server,
  ExternalLink,
} from "lucide-react";
import {
  fetchInstances, upsertInstance, deleteInstance,
  type WhatsAppInstance,
} from "@/lib/crm";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";


interface IntSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
}

const WHATSAPP_KEYS = ["whatsapp_api_key", "whatsapp_request_url", "evolution_instance_name", "evolution_instance_id"];

const FIELD_META: Record<string, { label: string; placeholder: string }> = {
  whatsapp_api_key: { label: "Chave API", placeholder: "Bearer token ou API key" },
  whatsapp_request_url: { label: "URL de Request", placeholder: "https://api.whatsapp.com/..." },
  evolution_instance_name: { label: "Nome da Instância (Evolution)", placeholder: "minha-instancia" },
  evolution_instance_id: { label: "ID da Instância (Evolution)", placeholder: "abc123..." },
  sms_request_url: { label: "URL de Request — SMS", placeholder: "https://api.sms-provider.com/..." },
  sms_api_token: { label: "API Token — SMS", placeholder: "Token de autenticação do provedor SMS" },
  sms_callback_url: { label: "Callback URL — SMS", placeholder: "URL para receber status de entrega" },
  n8n_webhook_url_booking: { label: "URL do Webhook — Marcações", placeholder: "https://meu-n8n.com/webhook/..." },
  n8n_webhook_url_stuck_appointments: { label: "URL do Webhook — Atendimentos Esquecidos", placeholder: "https://meu-n8n.com/webhook/..." },
  n8n_marketing_webhook: { label: "URL do Webhook — Campanhas de Marketing", placeholder: "https://meu-n8n.com/webhook/marketing" },
  
};

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-notifications`;
const CALLBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notification-callback`;
const REVIEW_REQUESTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-review-requests`;
const REVIEW_CALLBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/review-callback`;

function DumpButton() {
  const [loading, setLoading] = useState(false);

  const handleDump = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dump-data`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Erro ao gerar dump");
      }

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `dump_${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Dump gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDump} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
      {loading ? "Gerando dump..." : "Exportar SQL"}
    </Button>
  );
}

function WhatsAppCard({
  settings,
  local,
  setLocal,
  enabledMap,
  toggleChannelSetting,
  update,
  queryClient,
  onSave,
  saving,
}: {
  settings: IntSetting[];
  local: IntSetting[];
  setLocal: React.Dispatch<React.SetStateAction<IntSetting[]>>;
  enabledMap: Record<string, boolean>;
  toggleChannelSetting: (key: string, value: boolean) => Promise<void>;
  update: (key: string, value: string) => void;
  queryClient: any;
  onSave: () => Promise<void>;
  saving: boolean;
}) {
  const [qrOpen, setQrOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");
  const [testOpen, setTestOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);

  const disabled = !(enabledMap["whatsapp_enabled"] ?? true);

  const getVal = (key: string) => local.find((s) => s.setting_key === key)?.setting_value || "";

  const ensureSetting = async (key: string) => {
    const exists = local.find((s) => s.setting_key === key);
    if (!exists) {
      await supabase.from("integration_settings").insert({ setting_key: key, setting_value: "" } as any);
      queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
    }
  };

  useEffect(() => {
    ["evolution_instance_name", "evolution_instance_id"].forEach(ensureSetting);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const baseUrl = getVal("whatsapp_request_url");
    const apiKey = getVal("whatsapp_api_key");
    const instanceName = getVal("evolution_instance_name");
    if (!baseUrl || !apiKey || !instanceName) return;

    (async () => {
      try {
        const url = `${baseUrl.replace(/\/+$/, "")}/instance/connectionState/${instanceName}`;
        const res = await fetch(url, { headers: { apikey: apiKey } });
        if (!res.ok) return;
        const data = await res.json();
        const state = data?.instance?.state || data?.state;
        setConnectionStatus(state === "open" ? "connected" : "disconnected");
      } catch {
        setConnectionStatus("disconnected");
      }
    })();
  }, [local]);

  const fetchQrCode = async () => {
    const baseUrl = getVal("whatsapp_request_url");
    const apiKey = getVal("whatsapp_api_key");
    const instanceName = getVal("evolution_instance_name");

    if (!baseUrl || !apiKey || !instanceName) {
      toast.error("Preencha a URL, Chave API e Nome da Instância antes de gerar o QR Code.");
      return;
    }

    setQrLoading(true);
    setQrOpen(true);
    setQrData(null);

    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/instance/connect/${instanceName}`;
      const res = await fetch(url, { headers: { apikey: apiKey } });

      if (!res.ok) throw new Error(`Erro ${res.status}`);

      const data = await res.json();

      if (data?.base64) {
        setQrData(data.base64);
      } else if (data?.qrcode?.base64) {
        setQrData(data.qrcode.base64);
      } else if (data?.instance?.status === "open") {
        setConnectionStatus("connected");
        toast.success("Instância já está conectada!");
      } else {
        throw new Error("QR Code não encontrado na resposta.");
      }
    } catch (err: any) {
      toast.error(`Erro ao gerar QR Code: ${err.message}`);
    } finally {
      setQrLoading(false);
    }
  };

  const checkStatus = async () => {
    const baseUrl = getVal("whatsapp_request_url");
    const apiKey = getVal("whatsapp_api_key");
    const instanceName = getVal("evolution_instance_name");

    if (!baseUrl || !apiKey || !instanceName) {
      toast.error("Preencha os dados da instância primeiro.");
      return;
    }

    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/instance/connectionState/${instanceName}`;
      const res = await fetch(url, { headers: { apikey: apiKey } });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const state = data?.instance?.state || data?.state;
      if (state === "open") {
        setConnectionStatus("connected");
        toast.success("WhatsApp conectado!");
      } else {
        setConnectionStatus("disconnected");
        toast.warning(`Estado: ${state || "desconhecido"}`);
      }
    } catch (err: any) {
      setConnectionStatus("disconnected");
      toast.error(`Erro ao verificar: ${err.message}`);
    }
  };

  return (
    <>
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WhatsAppIcon className="w-5 h-5 text-muted-foreground" />
            <Label className="text-sm font-semibold">WhatsApp</Label>
            {connectionStatus === "connected" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] px-2 py-0.5 text-[10px] font-semibold">
                <Wifi className="w-3 h-3" /> Conectado
              </span>
            )}
            {connectionStatus === "disconnected" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 text-destructive px-2 py-0.5 text-[10px] font-semibold">
                <WifiOff className="w-3 h-3" /> Desconectado
              </span>
            )}
          </div>
          <Switch
            checked={enabledMap["whatsapp_enabled"] ?? true}
            onCheckedChange={(v) => toggleChannelSetting("whatsapp_enabled", v)}
          />
        </div>

        {settings.map((setting) => {
          const meta = FIELD_META[setting.setting_key];
          if (!meta) return null;
          const isApiKey = setting.setting_key === "whatsapp_api_key";
          return (
            <div key={setting.id} className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{meta.label}</Label>
              {isApiKey ? (
                <div className="flex gap-1">
                  <Input
                    value={setting.setting_value || ""}
                    onChange={(e) => update(setting.setting_key, e.target.value)}
                    placeholder={meta.placeholder}
                    type={showApiKey ? "text" : "password"}
                    disabled={disabled}
                    className="flex-1"
                  />
                  <Button type="button" size="icon" variant="outline" onClick={() => setShowApiKey((p) => !p)} title={showApiKey ? "Ocultar" : "Mostrar"}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button type="button" size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(setting.setting_value || ""); toast.success("Chave API copiada!"); }} title="Copiar">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Input
                  value={setting.setting_value || ""}
                  onChange={(e) => update(setting.setting_key, e.target.value)}
                  placeholder={meta.placeholder}
                  type={setting.setting_key.includes("key") ? "password" : "text"}
                  disabled={disabled}
                />
              )}
            </div>
          );
        })}

        {!local.find((s) => s.setting_key === "evolution_instance_name") && (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Nome da Instância (Evolution)
            </Label>
            <Input
              placeholder="minha-instancia"
              disabled={disabled}
              onChange={async (e) => {
                const val = e.target.value;
                if (val) {
                  await supabase
                    .from("integration_settings")
                    .insert({ setting_key: "evolution_instance_name", setting_value: val } as any);
                  queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
                }
              }}
            />
          </div>
        )}
        {!local.find((s) => s.setting_key === "evolution_instance_id") && (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              ID da Instância (Evolution)
            </Label>
            <Input
              placeholder="abc123..."
              disabled={disabled}
              onChange={async (e) => {
                const val = e.target.value;
                if (val) {
                  await supabase
                    .from("integration_settings")
                    .insert({ setting_key: "evolution_instance_id", setting_value: val } as any);
                  queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
                }
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchQrCode} disabled={disabled}>
              <QrCode className="w-4 h-4 mr-2" />
              Gerar QR Code
            </Button>
            <Button variant="outline" size="sm" onClick={checkStatus} disabled={disabled}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificar Conexão
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTestOpen(true)} disabled={disabled}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Testar
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WhatsAppIcon className="w-5 h-5" />
              Conectar WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {qrLoading ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </>
            ) : connectionStatus === "connected" && !qrData ? (
              <div className="text-center space-y-3">
                <Wifi className="w-16 h-16 mx-auto text-[hsl(var(--success))]" />
                <p className="text-sm font-medium">Instância já está conectada!</p>
                <p className="text-xs text-muted-foreground">O WhatsApp está ativo e pronto para enviar mensagens.</p>
              </div>
            ) : qrData ? (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={qrData.startsWith("data:") ? qrData : `data:image/png;base64,${qrData}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Abra o WhatsApp no seu telefone → <strong>Dispositivos vinculados</strong> →{" "}
                  <strong>Vincular dispositivo</strong> → Escaneie o código acima.
                </p>
                <Button variant="outline" size="sm" onClick={fetchQrCode}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar novo QR Code
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum QR Code disponível.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Message Modal */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WhatsAppIcon className="w-5 h-5" />
              Enviar Mensagem de Teste
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Número de telefone</Label>
              <PhoneInput value={testPhone} onChange={setTestPhone} placeholder="Número do destinatário" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Mensagem</Label>
              <Textarea
                readOnly
                value="✅ Mensagem de teste enviada com sucesso pelo sistema de agendamento. Se recebeu esta mensagem, a integração está a funcionar corretamente!"
                rows={3}
                className="text-sm bg-muted/50"
              />
            </div>
            <Button
              className="w-full"
              onClick={async () => {
                const baseUrl = getVal("whatsapp_request_url");
                const apiKey = getVal("whatsapp_api_key");
                const instanceName = getVal("evolution_instance_name");

                if (!baseUrl || !apiKey || !instanceName) {
                  toast.error("Preencha a URL, Chave API e Nome da Instância.");
                  return;
                }
                if (!testPhone) {
                  toast.error("Introduza um número de telefone.");
                  return;
                }

                setTestSending(true);
                try {
                  const number = testPhone.replace(/\D/g, "");
                  const url = `${baseUrl.replace(/\/+$/, "")}/message/sendText/${instanceName}`;
                  const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", apikey: apiKey },
                    body: JSON.stringify({
                      number,
                      text: "✅ Mensagem de teste enviada com sucesso pelo sistema de agendamento. Se recebeu esta mensagem, a integração está a funcionar corretamente!",
                    }),
                  });

                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || `Erro ${res.status}`);
                  }

                  toast.success("Mensagem de teste enviada!");
                  setTestOpen(false);
                  setTestPhone("");
                } catch (err: any) {
                  toast.error(`Erro ao enviar: ${err.message}`);
                } finally {
                  setTestSending(false);
                }
              }}
              disabled={testSending}
            >
              {testSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <WhatsAppIcon className="w-4 h-4 mr-2" />}
              {testSending ? "Enviando..." : "Enviar Teste"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmbedCard() {
  const [copied, setCopied] = useState(false);

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings-embed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("booking_url")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const bookingBase = (clinicSettings as any)?.booking_url || window.location.origin + "/agendar";
  const embedUrl = `${bookingBase}?embed=true`;
  const iframeCode = `<iframe src="${embedUrl}" style="width:100%;min-height:700px;border:none;" allow="clipboard-write"></iframe>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Code2 className="w-5 h-5 text-muted-foreground" />
        <Label className="text-sm font-semibold">Incorporar Formulário de Agendamento</Label>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Integre o formulário de agendamento em qualquer página ou website externo. Cole o código abaixo no HTML do seu site.
      </p>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Código iframe</Label>
        <div className="flex items-start gap-2">
          <textarea
            readOnly
            value={iframeCode}
            rows={3}
            className="flex-1 font-mono text-xs p-3 rounded-md border border-border bg-muted/50 resize-none"
          />
          <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0 mt-0.5">
            {copied ? <Check className="w-4 h-4 text-accent-foreground" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL com embed</Label>
        <Input readOnly value={embedUrl} className="font-mono text-xs" />
      </div>
    </Card>
  );
}
// SmsSenderField removed — now integrated into main save flow

// ─── Evolution API Instances Card ───────────────────────────────────────────

const LEADS_WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leads-webhook`;

function InstancesCard() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<WhatsAppInstance>>({});
  const [saving, setSaving] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInstances().then(setInstances).catch(console.error).finally(() => setLoading(false));
  }, []);

  function startNew() {
    const draft = { instance_name: "", api_url: "https://", api_key: "" };
    setForm(draft);
    setEditingId("NEW");
  }

  function startEdit(inst: WhatsAppInstance) {
    setForm({ ...inst });
    setEditingId(inst.id);
  }

  async function handleSave() {
    if (!form.instance_name || !form.api_url) {
      toast.error("Nome e URL são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const saved = await upsertInstance(form as any);
      if (editingId === "NEW") {
        setInstances(prev => [...prev, saved]);
      } else {
        setInstances(prev => prev.map(i => i.id === saved.id ? saved : i));
      }
      setEditingId(null);
      toast.success("Instância salva!");
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteInstance(id);
      setInstances(prev => prev.filter(i => i.id !== id));
      toast.success("Instância removida.");
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    }
  }

  async function handleConnect(inst: WhatsAppInstance) {
    setQrData(null);
    setQrLoading(true);
    setQrOpen(true);
    try {
      const url = `${inst.api_url.replace(/\/+$/, "")}/instance/connect/${inst.instance_name}`;
      const res = await fetch(url, { headers: { apikey: inst.api_key ?? "" } });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const qr = data?.base64 || data?.qrcode?.base64 || null;
      if (qr) {
        setQrData(qr);
        await upsertInstance({ ...inst, qr_code: qr, status: "connecting" });
        setInstances(prev => prev.map(i => i.id === inst.id ? { ...i, status: "connecting" } : i));
      } else if (data?.instance?.status === "open") {
        setQrOpen(false);
        await upsertInstance({ ...inst, status: "connected" });
        setInstances(prev => prev.map(i => i.id === inst.id ? { ...i, status: "connected" } : i));
        toast.success("Já conectado!");
      }
    } catch (e: any) {
      toast.error(`Erro ao conectar: ${e.message}`);
    } finally {
      setQrLoading(false);
    }
  }

  async function handleCheckStatus(inst: WhatsAppInstance) {
    try {
      const url = `${inst.api_url.replace(/\/+$/, "")}/instance/connectionState/${inst.instance_name}`;
      const res = await fetch(url, { headers: { apikey: inst.api_key ?? "" } });
      const data = await res.json();
      const state = data?.instance?.state || data?.state;
      const status: WhatsAppInstance["status"] = state === "open" ? "connected" : "disconnected";
      await upsertInstance({ ...inst, status, phone_number: data?.instance?.profilePictureUrl ? inst.phone_number : null });
      setInstances(prev => prev.map(i => i.id === inst.id ? { ...i, status } : i));
      toast(state === "open" ? "✅ Conectado!" : `Estado: ${state || "desconhecido"}`);
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    }
  }

  const statusBadge = (status: string) => {
    if (status === "connected") return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] font-semibold"><Wifi className="w-2.5 h-2.5" /> Conectado</span>;
    if (status === "connecting") return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 font-semibold"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Conectando</span>;
    return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-destructive/30 bg-destructive/10 text-destructive font-semibold"><WifiOff className="w-2.5 h-2.5" /> Desconectado</span>;
  };

  return (
    <>
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-muted-foreground" />
            <Label className="text-sm font-semibold">Instâncias Evolution API</Label>
          </div>
          <Button size="sm" variant="outline" onClick={startNew}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova instância
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Gerencie instâncias do Evolution API. Cada instância pode ser um número WhatsApp diferente.
        </p>

        {/* Webhook URL para leads */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Webhook URL — Leads</Label>
          <p className="text-xs text-muted-foreground">Use esta URL em landing pages para criar leads automaticamente no Pipeline.</p>
          <div className="flex items-center gap-2">
            <Input readOnly value={LEADS_WEBHOOK_URL} className="font-mono text-xs flex-1" />
            <Button size="icon" variant="outline" className="shrink-0" onClick={() => {
              navigator.clipboard.writeText(LEADS_WEBHOOK_URL);
              setCopiedWebhook(true);
              toast.success("URL copiada!");
              setTimeout(() => setCopiedWebhook(false), 2000);
            }}>
              {copiedWebhook ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Body: <code className="bg-muted px-1 py-0.5 rounded font-mono">{"{ name, phone?, email?, source?, message? }"}</code></p>
        </div>

        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : instances.length === 0 && editingId !== "NEW" ? (
          <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
            Nenhuma instância configurada. Clique em "Nova instância" para adicionar.
          </p>
        ) : (
          <div className="space-y-3">
            {instances.map(inst => (
              <div key={inst.id} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{inst.instance_name}</p>
                    <p className="text-xs text-muted-foreground">{inst.api_url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(inst.status)}
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleConnect(inst)}>
                      <QrCode className="w-3 h-3 mr-1" /> Conectar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleCheckStatus(inst)} title="Verificar status">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(inst)} title="Editar">
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(inst.id)} title="Remover">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit/New form */}
        {editingId && (
          <div className="border border-primary/20 rounded-xl p-4 space-y-3 bg-primary/5">
            <p className="text-xs font-medium text-foreground">{editingId === "NEW" ? "Nova instância" : "Editar instância"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome da instância</Label>
                <Input
                  placeholder="minha-clinica"
                  value={form.instance_name ?? ""}
                  onChange={e => setForm(f => ({ ...f, instance_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">URL da API Evolution</Label>
                <Input
                  placeholder="https://api.evolution.com"
                  value={form.api_url ?? ""}
                  onChange={e => setForm(f => ({ ...f, api_url: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Chave API (apikey)</Label>
              <div className="flex gap-1">
                <Input
                  type={showKey[editingId] ? "text" : "password"}
                  placeholder="Bearer token ou API key"
                  value={form.api_key ?? ""}
                  onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                  className="flex-1"
                />
                <Button type="button" size="icon" variant="outline" onClick={() => setShowKey(s => ({ ...s, [editingId]: !s[editingId] }))}>
                  {showKey[editingId] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* QR Code modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" /> Conectar WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {qrLoading ? (
              <><Loader2 className="w-12 h-12 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Gerando QR Code...</p></>
            ) : qrData ? (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrData.startsWith("data:") ? qrData : `data:image/png;base64,${qrData}`} alt="QR Code" className="w-64 h-64 object-contain" />
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Abra o WhatsApp → <strong>Dispositivos vinculados</strong> → <strong>Vincular dispositivo</strong> → Escaneie.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum QR Code disponível.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function IntegrationsTab() {
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<IntSetting[]>([]);
  const [copied, setCopied] = useState(false);
  const [birthdayEnabled, setBirthdayEnabled] = useState(true);
  const [inactiveEnabled, setInactiveEnabled] = useState(true);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [smsTestOpen, setSmsTestOpen] = useState(false);
  const [smsTestPhone, setSmsTestPhone] = useState("");
  const [smsTestSending, setSmsTestSending] = useState(false);
  const [smsSenderName, setSmsSenderName] = useState("");
  const [smsLogsOpen, setSmsLogsOpen] = useState(false);
  const [showSmsToken, setShowSmsToken] = useState(false);
  const [showCronSecret, setShowCronSecret] = useState(false);

  const senderNameLoaded = useRef(false);
  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings-sms"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("id, inactivity_days, sms_sender_name")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      let row = data;

      if (!row) {
        const { data: created, error: createErr } = await supabase
          .from("clinic_settings")
          .insert({})
          .select("id, inactivity_days, sms_sender_name")
          .single();

        if (createErr) throw createErr;
        row = created;
      }

      if (!row) throw new Error("Não foi possível carregar clinic_settings.");

      if (!senderNameLoaded.current) {
        setSmsSenderName((row as any).sms_sender_name || "");
        senderNameLoaded.current = true;
      }

      return row as { id: string; inactivity_days: number | null; sms_sender_name: string | null };
    },
  });

  const inactivityDays = clinicSettings?.inactivity_days ?? 90;

  const { isLoading } = useQuery({
    queryKey: ["integration-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("integration_settings").select("*").order("setting_key");
      if (error) throw error;
      // Deduplicate by setting_key — keep only first occurrence per key
      const seen = new Set<string>();
      const deduped = (data as IntSetting[]).filter((s) => {
        if (seen.has(s.setting_key)) return false;
        seen.add(s.setting_key);
        return true;
      });
      setLocal(deduped);
      const map: Record<string, boolean> = {};
      (data as IntSetting[]).forEach((s) => {
        if (s.setting_key === "n8n_webhook_enabled_birthday") {
          setBirthdayEnabled(s.setting_value === "true");
        }
        if (s.setting_key === "n8n_webhook_enabled_inactive") {
          setInactiveEnabled(s.setting_value === "true");
        }
        if (["whatsapp_enabled", "sms_enabled"].includes(s.setting_key)) {
          map[s.setting_key] = s.setting_value === "true";
        }
      });
      setEnabledMap((prev) => ({ ...prev, ...map }));
      return data;
    },
  });

  const { data: smsLogs, refetch: refetchLogs } = useQuery({
    queryKey: ["sms-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sms_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as Array<{
        id: string;
        message_id: string | null;
        phone: string;
        message: string | null;
        status: string;
        created_at: string;
        updated_at: string;
        callback_data: Record<string, unknown> | null;
      }>;
    },
    enabled: smsLogsOpen,
  });

  const toggleChannelSetting = async (key: string, value: boolean) => {
    setEnabledMap((prev) => ({ ...prev, [key]: value }));
    const setting = local.find((s) => s.setting_key === key);
    if (setting) {
      await supabase
        .from("integration_settings")
        .update({ setting_value: value ? "true" : "false", updated_at: new Date().toISOString() } as any)
        .eq("id", setting.id);
    } else {
      await supabase
        .from("integration_settings")
        .insert({ setting_key: key, setting_value: value ? "true" : "false" } as any);
      queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
    }
    toast.success("Canal atualizado.");
  };

  const update = (key: string, value: string) => {
    setLocal((prev) => prev.map((s) => (s.setting_key === key ? { ...s, setting_value: value } : s)));
  };

  const saveSetting = async (setting: IntSetting) => {
    const { error } = await supabase
      .from("integration_settings")
      .update({ setting_value: setting.setting_value, updated_at: new Date().toISOString() } as any)
      .eq("id", setting.id);
    if (error) throw error;
  };

  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [savingSms, setSavingSms] = useState(false);
  const [savingWebhooks, setSavingWebhooks] = useState(false);

  const saveWhatsApp = async () => {
    setSavingWhatsApp(true);
    try {
      const whatsKeys = WHATSAPP_KEYS;
      const saveable = local.filter((s) => whatsKeys.includes(s.setting_key));
      for (const s of saveable) {
        await saveSetting(s);
      }
      toast.success("WhatsApp salvo.");
      queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
    } catch (err: any) {
      toast.error(err?.message ? `Erro ao salvar: ${err.message}` : "Erro ao salvar.");
    } finally {
      setSavingWhatsApp(false);
    }
  };

  const saveSms = async () => {
    setSavingSms(true);
    try {
      const smsKeys = ["sms_request_url", "sms_api_token", "sms_callback_url"];
      const saveable = local.filter((s) => smsKeys.includes(s.setting_key));
      for (const s of saveable) {
        if (s.id?.startsWith("temp-")) {
          await supabase
            .from("integration_settings")
            .insert({ setting_key: s.setting_key, setting_value: s.setting_value } as any);
        } else {
          await saveSetting(s);
        }
      }
      // Save SMS sender name to clinic_settings
      if (!clinicSettings?.id) {
        throw new Error("Clinic settings não encontrado para salvar remetente SMS.");
      }
      const { error: senderErr } = await supabase
        .from("clinic_settings")
        .update({ sms_sender_name: smsSenderName } as any)
        .eq("id", clinicSettings.id);
      if (senderErr) throw senderErr;
      senderNameLoaded.current = false;
      toast.success("SMS salvo.");
      queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-settings-sms"] });
    } catch (err: any) {
      toast.error(err?.message ? `Erro ao salvar: ${err.message}` : "Erro ao salvar.");
    } finally {
      setSavingSms(false);
    }
  };

  const saveWebhooks = async () => {
    setSavingWebhooks(true);
    try {
      const webhookKeys = ["n8n_webhook_url_booking", "n8n_webhook_url_stuck_appointments", "n8n_cron_secret", "n8n_marketing_webhook"];
      const saveable = local.filter((s) => webhookKeys.includes(s.setting_key));
      for (const s of saveable) {
        await saveSetting(s);
      }
      toast.success("Webhooks salvos.");
      queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
    } catch (err: any) {
      toast.error(err?.message ? `Erro ao salvar: ${err.message}` : "Erro ao salvar.");
    } finally {
      setSavingWebhooks(false);
    }
  };

  const toggleWebhookSetting = async (key: string, value: boolean) => {
    const setting = local.find((s) => s.setting_key === key);
    if (setting) {
      await supabase
        .from("integration_settings")
        .update({ setting_value: value ? "true" : "false", updated_at: new Date().toISOString() } as any)
        .eq("id", setting.id);
    }
    if (key === "n8n_webhook_enabled_birthday") setBirthdayEnabled(value);
    else setInactiveEnabled(value);
    toast.success("Configuração atualizada.");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    toast.success("URL copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading)
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );

  const whatsappSettings = local.filter((s) => WHATSAPP_KEYS.includes(s.setting_key));
  const otherSettings = local.filter(
    (s) =>
      !WHATSAPP_KEYS.includes(s.setting_key) &&
      !s.setting_key.startsWith("n8n_") &&
      s.setting_key !== "sms_request_url" &&
      s.setting_key !== "sms_api_token" &&
      s.setting_key !== "sms_callback_url" &&
      !["whatsapp_enabled", "sms_enabled"].includes(s.setting_key) &&
      FIELD_META[s.setting_key],
  );

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-light tracking-wider">
          INTEGRAÇÕES
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Configure chaves de API e URLs para integrações externas.</p>
      </div>

      {/* WhatsApp card */}
      <WhatsAppCard
        settings={whatsappSettings}
        local={local}
        setLocal={setLocal}
        enabledMap={enabledMap}
        toggleChannelSetting={toggleChannelSetting}
        update={update}
        queryClient={queryClient}
        onSave={saveWhatsApp}
        saving={savingWhatsApp}
      />

      {/* SMS card */}
      {(() => {
        const smsUrl = local.find((s) => s.setting_key === "sms_request_url");
        const smsToken = local.find((s) => s.setting_key === "sms_api_token");
        const smsCallback = local.find((s) => s.setting_key === "sms_callback_url");
        const defaultCallbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sms-callback`;
        const smsDisabled = !(enabledMap["sms_enabled"] ?? true);
        return (
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <Label className="text-sm font-semibold">SMS</Label>
              </div>
              <Switch
                checked={enabledMap["sms_enabled"] ?? true}
                onCheckedChange={(v) => toggleChannelSetting("sms_enabled", v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL de Request</Label>
              <Input
                value={smsUrl?.setting_value || ""}
                onChange={(e) => {
                  if (smsUrl) {
                    update("sms_request_url", e.target.value);
                  } else {
                    const newSetting: IntSetting = { id: "temp-sms-url", setting_key: "sms_request_url", setting_value: e.target.value };
                    setLocal((prev) => [...prev, newSetting]);
                  }
                }}
                placeholder={FIELD_META.sms_request_url.placeholder}
                disabled={smsDisabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">API Token</Label>
              <div className="flex gap-1">
                <Input
                  value={smsToken?.setting_value || ""}
                  onChange={(e) => {
                    if (smsToken) {
                      update("sms_api_token", e.target.value);
                    } else {
                      const newSetting: IntSetting = { id: "temp-sms-token", setting_key: "sms_api_token", setting_value: e.target.value };
                      setLocal((prev) => [...prev, newSetting]);
                    }
                  }}
                  placeholder={FIELD_META.sms_api_token.placeholder}
                  type={showSmsToken ? "text" : "password"}
                  autoComplete="new-password"
                  name="sms_api_token"
                  disabled={smsDisabled}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setShowSmsToken((v) => !v)}
                  disabled={smsDisabled}
                  title={showSmsToken ? "Ocultar" : "Ver"}
                >
                  {showSmsToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  disabled={smsDisabled || !smsToken?.setting_value}
                  title="Copiar"
                  onClick={() => {
                    if (smsToken?.setting_value) {
                      navigator.clipboard.writeText(smsToken.setting_value);
                      toast.success("Token copiado!");
                    }
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Callback URL</Label>
              <Input
                value={smsCallback?.setting_value || defaultCallbackUrl}
                onChange={(e) => {
                  if (smsCallback) {
                    update("sms_callback_url", e.target.value);
                  } else {
                    const newSetting: IntSetting = { id: "temp-sms-callback", setting_key: "sms_callback_url", setting_value: e.target.value };
                    setLocal((prev) => [...prev, newSetting]);
                  }
                }}
                placeholder={FIELD_META.sms_callback_url.placeholder}
                disabled={smsDisabled}
              />
              <p className="text-xs text-muted-foreground">Recebe atualizações de status de entrega do SMS. O endpoint interno já está pré-configurado.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Remetente SMS</Label>
              <Input
                value={smsSenderName}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 11);
                  setSmsSenderName(v);
                }}
                maxLength={11}
                placeholder="Máx 11 caracteres alfanuméricos"
                disabled={smsDisabled}
              />
              <p className="text-xs text-muted-foreground">Máximo 11 caracteres alfanuméricos (A-Z, 0-9)</p>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSmsTestOpen(true)} disabled={smsDisabled}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Testar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSmsLogsOpen(!smsLogsOpen); if (!smsLogsOpen) refetchLogs(); }}
                  disabled={smsDisabled}
                >
                  <History className="w-4 h-4 mr-2" />
                  Logs
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={saveSms} disabled={savingSms}>
                {savingSms ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {savingSms ? "Salvando..." : "Salvar"}
              </Button>
            </div>
            {smsLogsOpen && (
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Registros de Callback
                  </Label>
                  <Button variant="ghost" size="sm" onClick={() => refetchLogs()} className="h-7 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Atualizar
                  </Button>
                </div>
                {!smsLogs || smsLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum registro encontrado.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] uppercase">Data</TableHead>
                          <TableHead className="text-[10px] uppercase">Telefone</TableHead>
                          <TableHead className="text-[10px] uppercase">Status</TableHead>
                          <TableHead className="text-[10px] uppercase">Message ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {smsLogs.map((log) => {
                          const statusColor = log.status === "delivered" ? "default"
                            : log.status === "queued" || log.status === "sent" ? "secondary"
                            : log.status === "failed" || log.status === "error" ? "destructive"
                            : "outline";
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </TableCell>
                              <TableCell className="text-xs font-mono">{log.phone}</TableCell>
                              <TableCell>
                                <Badge variant={statusColor as any} className="text-[10px]">{log.status}</Badge>
                              </TableCell>
                              <TableCell className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                                {log.message_id || "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })()}

      {/* SMS Test Modal */}
      <Dialog open={smsTestOpen} onOpenChange={setSmsTestOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Enviar SMS de Teste
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const smsUrl = local.find((s) => s.setting_key === "sms_request_url")?.setting_value || "";
            const smsApiToken = local.find((s) => s.setting_key === "sms_api_token")?.setting_value || "";
            const callbackUrl = local.find((s) => s.setting_key === "sms_callback_url")?.setting_value
              || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sms-callback`;
            
            const messageText = "Mensagem de teste enviada pelo sistema de agendamento. Se recebeu este SMS, a integração está a funcionar corretamente!";
            const cleanPhone = smsTestPhone ? `+${smsTestPhone.replace(/\D/g, "")}` : "";
            const payload: Record<string, unknown> = {
              callback: callbackUrl,
              mensagem: messageText,
              remetente: smsSenderName || "",
              destinatario: cleanPhone,
            };

            return (
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Número de telefone</Label>
                  <PhoneInput value={smsTestPhone} onChange={setSmsTestPhone} placeholder="Número do destinatário" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Mensagem</Label>
                  <Textarea
                    readOnly
                    value={messageText}
                    rows={3}
                    className="text-sm bg-muted/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Payload (POST → {smsUrl || "URL não configurada"})</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                        toast.success("Payload copiado!");
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-x-auto max-h-64 whitespace-pre-wrap break-all font-mono">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                </div>
                <Button
                  className="w-full"
                  onClick={async () => {
                    const smsUrl = local.find((s) => s.setting_key === "sms_request_url")?.setting_value;
                    const smsApiToken = local.find((s) => s.setting_key === "sms_api_token")?.setting_value;
                    const callbackUrl = local.find((s) => s.setting_key === "sms_callback_url")?.setting_value
                      || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sms-callback`;

                    if (!smsUrl) {
                      toast.error("Configure a URL de Request do SMS primeiro.");
                      return;
                    }
                    if (!smsApiToken) {
                      toast.error("Configure o API Token do SMS primeiro.");
                      return;
                    }

                    setSmsTestSending(true);
                    try {
                      const phoneForLog = smsTestPhone ? `+${smsTestPhone.replace(/\D/g, "")}` : "N/A";
                      const messageText = "Mensagem de teste enviada pelo sistema de agendamento. Se recebeu este SMS, a integração está a funcionar corretamente!";

                      const payload: Record<string, unknown> = {
                        callback: callbackUrl,
                        mensagem: messageText,
                        remetente: smsSenderName || "",
                        destinatario: phoneForLog,
                      };

                      const res = await fetch(smsUrl.trim(), {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                      });

                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.message || err.error || `Erro ${res.status}`);
                      }

                      const data = await res.json().catch(() => ({}));

                      await supabase.from("sms_logs").insert({
                        message_id: data.message_id || null,
                        phone: phoneForLog,
                        message: messageText,
                        status: "queued",
                      } as any);

                      toast.success("SMS de teste enviado!");
                      setSmsTestOpen(false);
                      setSmsTestPhone("");
                    } catch (err: any) {
                      toast.error(`Erro ao enviar: ${err.message}`);
                    } finally {
                      setSmsTestSending(false);
                    }
                  }}
                  disabled={smsTestSending}
                >
                  {smsTestSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                  {smsTestSending ? "Enviando..." : "Enviar Teste"}
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Webhooks — unified card */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-muted-foreground" />
          <Label className="text-sm font-semibold">Webhooks (n8n)</Label>
        </div>

        {/* Booking webhook */}
        {(() => {
          const bookingSetting = local.find((s) => s.setting_key === "n8n_webhook_url_booking");
          const meta = FIELD_META["n8n_webhook_url_booking"];
          return (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{meta.label}</Label>
              <p className="text-xs text-muted-foreground">
                Ao criar, alterar ou cancelar uma marcação, o sistema dispara automaticamente um POST para este URL.
              </p>
              {bookingSetting ? (
                <Input
                  value={bookingSetting.setting_value || ""}
                  onChange={(e) => update("n8n_webhook_url_booking", e.target.value)}
                  placeholder={meta.placeholder}
                  type="url"
                  autoComplete="off"
                  spellCheck={false}
                />
              ) : (
                <Input
                  placeholder={meta.placeholder}
                  type="url"
                  autoComplete="off"
                  spellCheck={false}
                  onBlur={async (e) => {
                    const val = e.target.value;
                    if (val) {
                      await supabase
                        .from("integration_settings")
                        .insert({ setting_key: "n8n_webhook_url_booking", setting_value: val } as any);
                      queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
                    }
                  }}
                />
              )}
            </div>
          );
        })()}

        {/* Stuck appointments webhook */}
        {(() => {
          const stuckSetting = local.find((s) => s.setting_key === "n8n_webhook_url_stuck_appointments");
          const stuckMeta = FIELD_META["n8n_webhook_url_stuck_appointments"];
          const stuckUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-stuck-appointments`;
          return (
            <div className="space-y-1.5 pt-3 border-t border-border">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{stuckMeta.label}</Label>
              <p className="text-xs text-muted-foreground">
                Verifica atendimentos "Em andamento" que ultrapassaram o horário previsto. Após 30 min notifica; após 60 min encerra.
              </p>
              {stuckSetting ? (
                <Input
                  value={stuckSetting.setting_value || ""}
                  onChange={(e) => update("n8n_webhook_url_stuck_appointments", e.target.value)}
                  placeholder={stuckMeta.placeholder}
                />
              ) : (
                <Input
                  placeholder={stuckMeta.placeholder}
                  onBlur={async (e) => {
                    const val = e.target.value;
                    if (val) {
                      await supabase
                        .from("integration_settings")
                        .insert({ setting_key: "n8n_webhook_url_stuck_appointments", setting_value: val } as any);
                      queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
                    }
                  }}
                />
              )}
            </div>
          );
        })()}

        {/* Marketing webhook */}
        {(() => {
          const mktSetting = local.find((s) => s.setting_key === "n8n_marketing_webhook");
          const mktMeta = FIELD_META["n8n_marketing_webhook"];
          return (
            <div className="space-y-1.5 pt-3 border-t border-border">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{mktMeta.label}</Label>
              <p className="text-xs text-muted-foreground">
                Quando uma campanha é enviada, o sistema faz POST para este URL com os destinatários em lotes. Se não estiver configurado, usa o webhook principal de marcações como fallback.
              </p>
              {mktSetting ? (
                <Input
                  value={mktSetting.setting_value || ""}
                  onChange={(e) => update("n8n_marketing_webhook", e.target.value)}
                  placeholder={mktMeta.placeholder}
                  type="url"
                  autoComplete="off"
                  spellCheck={false}
                />
              ) : (
                <Input
                  placeholder={mktMeta.placeholder}
                  type="url"
                  autoComplete="off"
                  spellCheck={false}
                  onBlur={async (e) => {
                    const val = e.target.value;
                    if (val) {
                      await supabase
                        .from("integration_settings")
                        .insert({ setting_key: "n8n_marketing_webhook", setting_value: val } as any);
                      queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
                    }
                  }}
                />
              )}
        </div>
          );
        })()}


        {/* Google Reviews cron endpoint */}
        <div className="space-y-1.5 pt-3 border-t border-border">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Avaliações Google</Label>
          <p className="text-xs text-muted-foreground">
            Configure um cron no n8n para chamar este endpoint periodicamente. Ver fluxo completo em <code className="bg-muted px-1 py-0.5 rounded font-mono">N8N_WORKFLOWS.md</code> (Workflow 6).
          </p>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">URL do Endpoint</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={REVIEW_REQUESTS_URL} className="font-mono text-xs flex-1" />
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(REVIEW_REQUESTS_URL);
                  toast.success("URL copiada!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Usa o mesmo header <code className="bg-muted px-1 py-0.5 rounded font-mono">x-cron-secret</code> para autenticação.
            </p>
          </div>

          {/* Review Callback URL */}
          <div className="space-y-1.5 pt-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">URL de Callback — Confirmação de Envio</Label>
            <p className="text-xs text-muted-foreground">
              Após cada envio (ou tentativa) o n8n deve chamar este endpoint com <code className="text-[10px] bg-muted px-1 py-0.5 rounded">POST</code> para confirmar sucesso ou reverter em caso de falha.
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={REVIEW_CALLBACK_URL} className="font-mono text-xs flex-1" />
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(REVIEW_CALLBACK_URL);
                  toast.success("URL copiada!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Body e contrato do callback documentados em <code className="bg-muted px-1 py-0.5 rounded font-mono">N8N_WORKFLOWS.md</code> (Workflow 6).</p>
            <p className="text-[10px] text-muted-foreground">
              Usa o mesmo header <code className="bg-muted px-1 py-0.5 rounded font-mono">x-cron-secret</code> para autenticação.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-border">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Automação Diária</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Configure um workflow no n8n para chamar este endpoint diariamente. Verifica aniversariantes e clientes inativos.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">URL do Endpoint</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={WEBHOOK_URL} className="font-mono text-xs flex-1" />
              <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-accent-foreground" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          {/* Notification Callback URL */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">URL de Callback — Registo de Envio</Label>
            <p className="text-xs text-muted-foreground">
              Após enviar cada notificação, o n8n deve chamar este endpoint com <code className="text-[10px] bg-muted px-1 py-0.5 rounded">POST</code> para registar o envio e evitar duplicados.
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={CALLBACK_URL} className="font-mono text-xs flex-1" />
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(CALLBACK_URL);
                  toast.success("URL de callback copiada!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Payload: <code className="bg-muted px-1 py-0.5 rounded font-mono">{"{ client_id, notification_type, channel, status }"}</code> — usa o mesmo header <code className="bg-muted px-1 py-0.5 rounded font-mono">x-cron-secret</code>.
            </p>
          </div>

        </div>

        {/* Chave de requisições cronológicas */}
        <div className="space-y-3 pt-3 border-t border-border">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Chave de Requisições Cronológicas</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Defina uma chave secreta e use-a no header <code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">x-cron-secret</code> do n8n para autenticar as chamadas cronológicas.
            </p>
          </div>
          {(() => {
            const cronSetting = local.find((s) => s.setting_key === "n8n_cron_secret");
            const cronValue = cronSetting?.setting_value || "";

            const generateSecret = () => {
              const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              let result = "";
              for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
              return result;
            };

            const handleGenerate = () => {
              const newSecret = generateSecret();
              if (cronSetting) {
                update("n8n_cron_secret", newSecret);
              } else {
                supabase
                  .from("integration_settings")
                  .insert({ setting_key: "n8n_cron_secret", setting_value: newSecret } as any)
                  .then(() => queryClient.invalidateQueries({ queryKey: ["integration-settings"] }));
              }
              setShowCronSecret(true);
              toast.success("Chave gerada!");
            };

            const handleCopyCron = () => {
              navigator.clipboard.writeText(cronValue);
              toast.success("Chave copiada!");
            };

            return (
              <div className="flex items-center gap-1.5">
                {cronSetting ? (
                  <Input
                    value={cronValue}
                    onChange={(e) => update("n8n_cron_secret", e.target.value)}
                    placeholder="Chave secreta para autenticar chamadas do n8n"
                    type={showCronSecret ? "text" : "password"}
                    autoComplete="off"
                    className="flex-1"
                  />
                ) : (
                  <Input
                    placeholder="Chave secreta para autenticar chamadas do n8n"
                    type={showCronSecret ? "text" : "password"}
                    autoComplete="off"
                    className="flex-1"
                    onBlur={async (e) => {
                      const val = e.target.value;
                      if (val) {
                        await supabase
                          .from("integration_settings")
                          .insert({ setting_key: "n8n_cron_secret", setting_value: val } as any);
                        queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
                      }
                    }}
                  />
                )}
                <Button type="button" size="icon" variant="outline" className="shrink-0" onClick={() => setShowCronSecret((p) => !p)} title={showCronSecret ? "Ocultar" : "Mostrar"}>
                  {showCronSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button type="button" size="icon" variant="outline" className="shrink-0" onClick={handleCopyCron} disabled={!cronValue} title="Copiar">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button type="button" size="icon" variant="outline" className="shrink-0" onClick={handleGenerate} title="Gerar chave aleatória">
                  <KeyRound className="w-4 h-4" />
                </Button>
              </div>
            );
          })()}
          <p className="text-[10px] text-muted-foreground">
            Envie no header HTTP: <code className="bg-muted px-1 py-0.5 rounded font-mono">x-cron-secret: &lt;valor&gt;</code>
          </p>
        </div>

        {/* Webhooks save button */}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button size="sm" variant="outline" onClick={saveWebhooks} disabled={savingWebhooks}>
            {savingWebhooks ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {savingWebhooks ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </Card>

      {/* Evolution API Instances */}
      <InstancesCard />

      {/* Embed iframe card */}
      <EmbedCard />
    </div>
  );
}

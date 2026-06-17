import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Star,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  Send,
  Users,
  ExternalLink,
  AlertTriangle,
  MapPin,
  Search,
  Link2,
  Copy,
  History as HistoryIcon,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import CampaignSmsPreview from "./CampaignSmsPreview";
import { PhoneInput } from "@/components/ui/phone-input";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { Send as SendIcon } from "lucide-react";

const SETTINGS_KEYS = [
  "review_enabled",
  "review_google_url",
  "review_place_id",
  "review_place_name",
  "review_channel",
  "review_delay_hours",
  "review_interval_days",
  "review_max_sends",
  "review_message",
  "review_message_whatsapp",
  "review_message_email",
  "review_message_sms",
  "review_email_subject",
];

const DEFAULT_MESSAGE =
  "Olá {nome}! 😊\n\nObrigado por ter escolhido os nossos serviços. A sua opinião é muito importante para nós!\n\nPode deixar-nos uma avaliação no Google? Demora menos de 1 minuto:\n{link_google}\n\nSe já avaliou, clique aqui para confirmar:\n{link_confirmar}\n\nObrigado! 🙏";

const DEFAULT_EMAIL_HTML = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:Manrope,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;border:1px solid #E8E2DA;overflow:hidden;">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#B0A496,#8B7D6B);padding:32px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.7);">A SUA OPINIÃO É IMPORTANTE</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:#FFFFFF;">{negocio}</h1>
  </td></tr>
  <!-- Corpo -->
  <tr><td style="padding:32px 40px;">
    <p style="font-size:15px;color:#2D2520;line-height:1.6;margin:0 0 20px;">Olá <strong>{nome}</strong> 😊,</p>
    <p style="font-size:15px;color:#807668;line-height:1.6;margin:0 0 24px;">Obrigado por ter escolhido os nossos serviços. A sua opinião é muito importante para nós e ajuda-nos a melhorar continuamente.</p>
    <p style="font-size:15px;color:#807668;line-height:1.6;margin:0 0 24px;">Pode deixar-nos uma avaliação no Google? Demora menos de 1 minuto:</p>
    <!-- CTA Google -->
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;" width="100%">
      <tr><td align="center">
        <table cellpadding="0" cellspacing="0">
          <tr><td style="background:linear-gradient(135deg,#B0A496,#8B7D6B);border-radius:6px;padding:14px 32px;">
            <a href="{link_google}" style="color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">⭐ Avaliar no Google</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <!-- Separador -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="border-top:1px solid #E8E2DA;"></td></tr>
    </table>
    <p style="font-size:13px;color:#B0A496;line-height:1.6;margin:0 0 16px;text-align:center;">Já avaliou? Clique abaixo para confirmar:</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr><td align="center">
        <table cellpadding="0" cellspacing="0">
          <tr><td style="background:#2D2520;border-radius:6px;padding:12px 28px;">
            <a href="{link_confirmar}" style="color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Confirmar Avaliação</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <p style="font-size:14px;color:#807668;text-align:center;margin:0;">Obrigado! 🙏</p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="border-top:1px solid #E8E2DA;padding:20px 40px;text-align:center;">
    <p style="font-size:11px;color:#B0A496;margin:0 0 8px;">© {negocio} · Notificação automática</p>
    <p style="font-size:11px;color:#B0A496;margin:0;">
      <a href="{link_unsubscribe}" style="color:#B0A496;text-decoration:underline;">Cancelar subscrição</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

export default function GoogleReviewsTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [placeModalOpen, setPlaceModalOpen] = useState(false);

  // Local form state
  const [enabled, setEnabled] = useState(false);
  const [googleUrl, setGoogleUrl] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [channels, setChannels] = useState<string[]>(["whatsapp"]);
  const [delayHours, setDelayHours] = useState("2");
  const [intervalDays, setIntervalDays] = useState("7");
  const [maxSends, setMaxSends] = useState("3");
  const [messages, setMessages] = useState<Record<string, string>>({
    whatsapp: DEFAULT_MESSAGE,
    email: DEFAULT_EMAIL_HTML,
    sms: DEFAULT_MESSAGE,
  });
  const [emailSubject, setEmailSubject] = useState("{negocio} — A sua opinião é importante! ⭐");
  const [activeMessageTab, setActiveMessageTab] = useState("whatsapp");
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testChannel, setTestChannel] = useState<string>("whatsapp");
  const [testRecipient, setTestRecipient] = useState("");
  const [testRecipientName, setTestRecipientName] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const handleSendTest = async () => {
    if (!testRecipient.trim()) {
      toast.error("Preencha o destinatário.");
      return;
    }
    setSendingTest(true);
    try {
      const { error } = await invokeEdgeFunction("test-review-message", {
        body: {
          channel: testChannel,
          recipient: testRecipient.trim(),
          recipient_name: testRecipientName.trim() || "Cliente Teste",
        },
      });
      if (error) throw error;
      toast.success("Teste enviado!");
      setTestDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar teste");
    } finally {
      setSendingTest(false);
    }
  };

  // Load settings
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["review-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_settings")
        .select("setting_key, setting_value")
        .in("setting_key", SETTINGS_KEYS);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => {
        map[s.setting_key] = s.setting_value || "";
      });
      return map;
    },
  });

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.review_enabled === "true");
    setGoogleUrl(settings.review_google_url || "");
    setPlaceId(settings.review_place_id || "");
    setPlaceName(settings.review_place_name || "");
    const savedChannels = settings.review_channel || "whatsapp";
    setChannels(savedChannels.split(",").filter(Boolean));
    setDelayHours(settings.review_delay_hours || "2");
    setIntervalDays(settings.review_interval_days || "7");
    setMaxSends(settings.review_max_sends || "3");
    setMessages({
      whatsapp: settings.review_message_whatsapp || settings.review_message || DEFAULT_MESSAGE,
      email: settings.review_message_email || DEFAULT_EMAIL_HTML,
      sms: settings.review_message_sms || settings.review_message || DEFAULT_MESSAGE,
    });
    setEmailSubject(settings.review_email_subject || "{negocio} — A sua opinião é importante! ⭐");
  }, [settings]);

  // Load system_url from clinic settings (used to build {link_confirmar})
  const { data: clinicInfo } = useQuery({
    queryKey: ["review-clinic-system-url"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_settings")
        .select("system_url")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  const systemUrl = (clinicInfo?.system_url || "").replace(/\/$/, "");

  // Load review requests stats
  const { data: stats } = useQuery({
    queryKey: ["review-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("id, confirmed_at, send_count, last_sent_at");
      if (error) throw error;
      const total = data?.length || 0;
      const confirmed = data?.filter((r: any) => r.confirmed_at).length || 0;
      const pending = data?.filter((r: any) => !r.confirmed_at && r.send_count > 0).length || 0;
      const waiting = data?.filter((r: any) => !r.confirmed_at && r.send_count === 0).length || 0;
      return { total, confirmed, pending, waiting };
    },
  });

  // Load pending review list
  const { data: pendingList, isLoading: loadingList } = useQuery({
    queryKey: ["review-pending-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("id, client_id, send_count, last_sent_at, next_send_at, confirmed_at, created_at")
        .is("confirmed_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const clientIds = data.map((r: any) => r.client_id);
      const { data: clients } = await supabase
        .from("clients")
        .select("id, full_name, phone, email")
        .in("id", clientIds);

      const clientMap: Record<string, any> = {};
      (clients || []).forEach((c: any) => {
        clientMap[c.id] = c;
      });

      return data.map((r: any) => ({
        ...r,
        client: clientMap[r.client_id] || { full_name: "—" },
      }));
    },
  });

  // Load confirmed list
  const { data: confirmedList } = useQuery({
    queryKey: ["review-confirmed-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("id, client_id, confirmed_at, send_count")
        .not("confirmed_at", "is", null)
        .order("confirmed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const clientIds = data.map((r: any) => r.client_id);
      const { data: clients } = await supabase.from("clients").select("id, full_name").in("id", clientIds);

      const clientMap: Record<string, any> = {};
      (clients || []).forEach((c: any) => {
        clientMap[c.id] = c;
      });

      return data.map((r: any) => ({
        ...r,
        client: clientMap[r.client_id] || { full_name: "—" },
      }));
    },
  });

  const handleSave = async () => {
    if (!placeId && !googleUrl.trim()) {
      toast.error("Conecte o seu negócio do Google ou insira um link");
      return;
    }
    // Auto-build review URL from Place ID if available
    const finalUrl = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : googleUrl.trim();

    setSaving(true);
    try {
      const pairs: Record<string, string> = {
        review_enabled: enabled ? "true" : "false",
        review_google_url: finalUrl,
        review_place_id: placeId,
        review_place_name: placeName,
        review_channel: channels.join(","),
        review_delay_hours: delayHours,
        review_interval_days: intervalDays,
        review_max_sends: maxSends,
        review_message: messages.whatsapp,
        review_message_whatsapp: messages.whatsapp,
        review_message_email: messages.email,
        review_message_sms: messages.sms,
        review_email_subject: emailSubject,
      };

      for (const [key, value] of Object.entries(pairs)) {
        await supabase
          .from("integration_settings")
          .upsert(
            { setting_key: key, setting_value: value, updated_at: new Date().toISOString() },
            { onConflict: "setting_key" },
          );
      }

      queryClient.invalidateQueries({ queryKey: ["review-settings"] });
      toast.success("Configurações de avaliações gravadas");
    } catch (err: any) {
      toast.error("Erro ao gravar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setTestDialogOpen(true)} className="gap-2">
          <SendIcon className="w-4 h-4" /> Enviar Teste
        </Button>
        <Button variant="outline" onClick={() => navigate("/marketing/avaliacoes/historico")} className="gap-2">
          <HistoryIcon className="w-4 h-4" /> Histórico
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total envios", value: stats?.total ?? 0, icon: Users },
          { label: "Confirmados", value: stats?.confirmed ?? 0, icon: CheckCircle2 },
          { label: "Pendentes", value: stats?.pending ?? 0, icon: Clock },
          { label: "Na fila", value: stats?.waiting ?? 0, icon: Send },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-3 text-center">
            <kpi.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-semibold">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </Card>
        ))}
      </div>

      {/* Settings */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Pedido de Avaliação Google
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Envie automaticamente pedidos de avaliação após serviços concluídos.
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={async (v) => {
              setEnabled(v);
              try {
                await supabase.from("integration_settings").upsert(
                  {
                    setting_key: "review_enabled",
                    setting_value: v ? "true" : "false",
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "setting_key" },
                );
                toast.success(v ? "Avaliações ativadas" : "Avaliações desativadas");
              } catch (err: any) {
                toast.error("Erro ao gravar estado");
                setEnabled(!v);
              }
            }}
          />
        </div>

        {/* Confirmation link info */}
        <div className={`rounded-lg border px-4 py-3 text-xs ${systemUrl ? "border-border bg-muted/40" : "border-destructive/30 bg-destructive/5"}`}>
          <p className="font-medium mb-1 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Link de confirmação ({"{link_confirmar}"})
          </p>
          {systemUrl ? (
            <p className="text-muted-foreground break-all">
              Usa o link do Sistema em <strong>Configurações</strong>:{" "}
              <code className="text-foreground">{systemUrl}/avaliacao/confirmar/&lt;token&gt;</code>
            </p>
          ) : (
            <p className="text-destructive">
              ⚠️ Configure o <strong>Link do Sistema</strong> em Configurações → Agenda para que o cliente receba um link com o seu domínio em vez do backend.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Place selector + Channels (left column) */}
            <div className="space-y-4">
              <div>
                <Label>Negócio Google *</Label>
                {placeId ? (
                  <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{placeName || "Negócio conectado"}</p>
                      <p className="text-xs text-muted-foreground truncate">Place ID: {placeId}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPlaceModalOpen(true)}
                      className="shrink-0 text-xs"
                    >
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-1.5 w-full justify-start gap-2 h-12 text-muted-foreground"
                    onClick={() => setPlaceModalOpen(true)}
                  >
                    <MapPin className="w-4 h-4" />
                    Conectar negócio do Google...
                  </Button>
                )}
              </div>

              <div>
                <Label>Canais de envio</Label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[
                    { value: "whatsapp", label: "WhatsApp" },
                    { value: "email", label: "E-mail" },
                    { value: "sms", label: "SMS" },
                  ].map((ch) => {
                    const checked = channels.includes(ch.value);
                    return (
                      <button
                        type="button"
                        key={ch.value}
                        onClick={() => {
                          setChannels((prev) => {
                            const next = checked ? prev.filter((c) => c !== ch.value) : [...prev, ch.value];
                            // If we just disabled the active tab, switch to first remaining
                            if (checked && activeMessageTab === ch.value) {
                              const fallback = next[0];
                              if (fallback) setActiveMessageTab(fallback);
                            }
                            // If we just enabled it, focus its tab
                            if (!checked) setActiveMessageTab(ch.value);
                            return next;
                          });
                        }}
                        className={`flex h-12 items-center gap-3 rounded-lg border px-4 text-sm font-medium transition-colors ${
                          checked
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-[4px] border-2 transition-colors ${
                            checked ? "border-primary bg-primary" : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {checked && (
                            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3,8 7,12 13,4" />
                            </svg>
                          )}
                        </span>
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right column: timing settings */}
            <div className="space-y-4">
              <div>
                <Label>Tempo após conclusão para pedir review</Label>
                <Select value={delayHours} onValueChange={setDelayHours}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="2">2 horas (recomendado)</SelectItem>
                    <SelectItem value="4">4 horas</SelectItem>
                    <SelectItem value="6">6 horas</SelectItem>
                    <SelectItem value="12">12 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="48">48 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Máx. de envios por cliente</Label>
                <Select value={maxSends} onValueChange={setMaxSends}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 vez</SelectItem>
                    <SelectItem value="2">2 vezes</SelectItem>
                    <SelectItem value="3">3 vezes (recomendado)</SelectItem>
                    <SelectItem value="5">5 vezes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className={maxSends === "1" ? "text-muted-foreground" : ""}>
                  Intervalo entre envios {maxSends === "1" && "(N/A — apenas 1 envio)"}
                </Label>
                <Select value={intervalDays} onValueChange={setIntervalDays} disabled={maxSends === "1"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="7">7 dias (recomendado)</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                    <SelectItem value="120">4 meses</SelectItem>
                    <SelectItem value="150">5 meses</SelectItem>
                    <SelectItem value="180">6 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-5 space-y-2">
          {/* Templates block */}
          <Label className="text-base font-medium">Mensagem por canal</Label>
          <Tabs value={activeMessageTab} onValueChange={setActiveMessageTab}>
            <TabsList className="w-full">
              <TabsTrigger value="whatsapp" className="flex-1 gap-1.5" disabled={!channels.includes("whatsapp")}>
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="email" className="flex-1 gap-1.5" disabled={!channels.includes("email")}>
                E-mail
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex-1 gap-1.5" disabled={!channels.includes("sms")}>
                SMS
              </TabsTrigger>
            </TabsList>
            {["whatsapp", "sms"].map((ch) => (
              <TabsContent key={ch} value={ch} className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Editar</Label>
                    <Textarea
                      rows={24}
                      value={messages[ch] || ""}
                      onChange={(e) => setMessages((prev) => ({ ...prev, [ch]: e.target.value }))}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Pré-visualização</Label>
                    <CampaignSmsPreview
                      senderName={placeName || "Negócio"}
                      message={(messages[ch] || "")
                        .replace(/\{nome\}/gi, "Maria")
                        .replace(/\{negocio\}/gi, placeName || "Negócio")
                        .replace(/\{link_google\}/gi, "https://g.co/...")
                        .replace(/\{link_confirmar\}/gi, "https://...")}
                      isWhatsApp={ch === "whatsapp"}
                    />
                  </div>
                </div>
              </TabsContent>
            ))}
            <TabsContent value="email" className="mt-2 space-y-3">
              <div>
                <Label className="text-xs">Assunto</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="{negocio} — A sua opinião é importante! ⭐"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Editar HTML</Label>
                  <Textarea
                    rows={24}
                    value={messages.email || ""}
                    onChange={(e) => setMessages((prev) => ({ ...prev, email: e.target.value }))}
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Pré-visualização</Label>
                  <div className="rounded-md border border-border bg-card p-4 min-h-[200px] max-h-[420px] overflow-y-auto">
                    {messages.email ? (
                      <div
                        className="prose prose-sm max-w-none text-xs text-muted-foreground prose-p:my-1 prose-h2:text-sm prose-h2:font-semibold prose-h2:text-foreground prose-h3:text-xs prose-h3:font-semibold prose-h3:text-foreground prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-a:text-primary"
                        dangerouslySetInnerHTML={{ __html: messages.email }}
                      />
                    ) : (
                      <p className="text-center text-xs text-muted-foreground/50 italic py-8">
                        O conteúdo do e-mail aparecerá aqui...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {["{nome}", "{nome_completo}", "{negocio}", "{link_google}", "{link_confirmar}"].map((v) => (
              <Badge key={v} variant="secondary" className="text-[10px]">
                {v}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Use <code className="text-primary">{"{link_google}"}</code> para o link de avaliação e{" "}
            <code className="text-primary">{"{link_confirmar}"}</code> para o link de confirmação.
          </p>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </Button>
        </div>
      </Card>

      {/* Pending list */}
      <Card className="p-5">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Pendentes ({pendingList?.length ?? 0})
        </h3>
        {loadingList ? (
          <Skeleton className="h-16 w-full" />
        ) : !pendingList?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido de avaliação pendente.</p>
        ) : (
          <div className="divide-y">
            {pendingList.map((r: any) => (
              <div key={r.id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.client?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.send_count} envio(s)
                    {r.last_sent_at && ` · Último: ${format(new Date(r.last_sent_at), "dd MMM HH:mm", { locale: pt })}`}
                    {r.next_send_at && ` · Próximo: ${format(new Date(r.next_send_at), "dd MMM", { locale: pt })}`}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {r.send_count > 0 ? "Enviado" : "Na fila"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirmed list */}
      {confirmedList && confirmedList.length > 0 && (
        <Card className="p-5">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Confirmados ({confirmedList.length})
          </h3>
          <div className="divide-y">
            {confirmedList.map((r: any) => (
              <div key={r.id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.client?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Confirmou em {format(new Date(r.confirmed_at), "dd MMM yyyy", { locale: pt })}
                    {" · "}
                    {r.send_count} envio(s)
                  </p>
                </div>
                <Badge variant="default" className="text-[10px] shrink-0">
                  ✓ Avaliou
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Place ID Modal */}
      <PlaceIdModal
        open={placeModalOpen}
        onOpenChange={setPlaceModalOpen}
        currentPlaceId={placeId}
        currentPlaceName={placeName}
        onConfirm={(id, name) => {
          setPlaceId(id);
          setPlaceName(name);
          setGoogleUrl(`https://search.google.com/local/writereview?placeid=${id}`);
          setPlaceModalOpen(false);
          toast.success("Negócio conectado! Não esqueça de gravar.");
        }}
      />

      {/* Test message Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SendIcon className="w-5 h-5" /> Enviar Teste
            </DialogTitle>
            <DialogDescription>
              Envie um pedido de avaliação de teste para validar o template e o canal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Canal</Label>
              <Select value={testChannel} onValueChange={setTestChannel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nome (opcional)</Label>
              <Input
                value={testRecipientName}
                onChange={(e) => setTestRecipientName(e.target.value)}
                placeholder="Cliente Teste"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">
                {testChannel === "email" ? "E-mail destinatário" : "Telefone destinatário"}
              </Label>
              {testChannel === "email" ? (
                <Input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="mt-1"
                />
              ) : (
                <PhoneInput value={testRecipient} onChange={(v) => setTestRecipient(v || "")} className="mt-1" />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTestDialogOpen(false)} disabled={sendingTest}>
                Cancelar
              </Button>
              <Button onClick={handleSendTest} disabled={sendingTest} className="gap-2">
                {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Place ID Modal ──────────────────────────────────────────── */
function PlaceIdModal({
  open,
  onOpenChange,
  currentPlaceId,
  currentPlaceName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentPlaceId: string;
  currentPlaceName: string;
  onConfirm: (placeId: string, placeName: string) => void;
}) {
  const [inputPlaceId, setInputPlaceId] = useState(currentPlaceId);
  const [inputName, setInputName] = useState(currentPlaceName);
  const [inputUrl, setInputUrl] = useState("");

  useEffect(() => {
    if (open) {
      setInputPlaceId(currentPlaceId);
      setInputName(currentPlaceName);
      setInputUrl("");
    }
  }, [open, currentPlaceId, currentPlaceName]);

  // Try to extract Place ID from a Google Maps URL
  const extractPlaceId = (url: string): string | null => {
    // Format: https://search.google.com/local/writereview?placeid=XXXX
    const match1 = url.match(/placeid=([A-Za-z0-9_-]+)/);
    if (match1) return match1[1];
    // Format: https://www.google.com/maps/place/.../@.../data=!...!1s0x...!2s(PLACE_ID)
    // or data param with place_id
    const match2 = url.match(/!1s(0x[a-f0-9]+:[a-f0-9]+)/i);
    if (match2) return match2[1];
    // ChIJ format
    const match3 = url.match(/(ChIJ[A-Za-z0-9_-]+)/);
    if (match3) return match3[1];
    return null;
  };

  const handleUrlPaste = (url: string) => {
    setInputUrl(url);
    const extracted = extractPlaceId(url);
    if (extracted) {
      setInputPlaceId(extracted);
    }
  };

  const canConfirm = inputPlaceId.trim().length > 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Conectar negócio
          </DialogTitle>
          <DialogDescription>
            Conecte o seu perfil do Google Meu Negócio para enviar pedidos de avaliação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Step 1: Find Place ID */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">1. Encontrar o Place ID</Label>
            <p className="text-xs text-muted-foreground">
              Abra o{" "}
              <a
                href="https://developers.google.com/maps/documentation/places/web-service/place-id#find-id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-0.5"
              >
                Google Place ID Finder <ExternalLink className="w-3 h-3" />
              </a>
              , pesquise o nome do seu negócio e copie o Place ID.
            </p>
          </div>

          {/* Option A: Paste URL */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Opção A — Cole o link do Google Maps ou link de avaliação
            </Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="https://www.google.com/maps/place/... ou https://g.page/r/..."
                value={inputUrl}
                onChange={(e) => handleUrlPaste(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Option B: Paste Place ID directly */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Opção B — Cole o Place ID diretamente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ChIJ... ou 0x..."
                value={inputPlaceId}
                onChange={(e) => setInputPlaceId(e.target.value)}
                className="pl-9 font-mono text-xs"
              />
            </div>
          </div>

          {/* Business name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">2. Nome do negócio (para referência)</Label>
            <Input placeholder="Ex: Bellex" value={inputName} onChange={(e) => setInputName(e.target.value)} />
          </div>

          {/* Preview */}
          {canConfirm && (
            <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Pré-visualização do link</p>
              <p className="text-xs font-mono break-all text-primary">
                https://search.google.com/local/writereview?placeid={inputPlaceId}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!canConfirm}
              onClick={() => onConfirm(inputPlaceId.trim(), inputName.trim())}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Conectar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

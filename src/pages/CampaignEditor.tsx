import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Send,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Users,
  Pencil,
  AlertTriangle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Image as ImageIcon,
  FileText,
  Settings,
  Eye,
  CalendarIcon,
  X,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parse } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import CampaignEmailPreview from "@/components/marketing/CampaignEmailPreview";
import CampaignSmsPreview from "@/components/marketing/CampaignSmsPreview";
import CampaignAudienceTab from "@/components/marketing/CampaignAudienceTab";
import { RichEditor } from "@/components/ui/rich-editor";
import { PhoneInput } from "@/components/ui/phone-input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Campaign {
  id?: string;
  name: string;
  channel: string;
  status: string;
  subject: string;
  show_header_image: boolean;
  header_image_url: string;
  cta_text: string;
  cta_url: string;
  content: string;
  audience_filter: string;
  include_no_optin: boolean;
  recipient_count: number;
  scheduled_at: string | null;
  send_delay_seconds: number;
  batch_size: number;
}

const defaultCampaign: Campaign = {
  name: "",
  channel: "email",
  status: "draft",
  subject: "",
  show_header_image: true,
  header_image_url: "",
  cta_text: "Marque agora",
  cta_url: "",
  content: "",
  audience_filter: "all",
  include_no_optin: false,
  recipient_count: 0,
  scheduled_at: null,
  send_delay_seconds: 30,
  batch_size: 1,
};

const defaultEmailTemplate = `<h2 style="text-align:center">Título da sua campanha</h2>
<p style="text-align:center">Escreva aqui o conteúdo do seu e-mail. Pode usar <strong>negrito</strong>, <em>itálico</em> e listas.</p>
<ul>
<li>Destaque 1</li>
<li>Destaque 2</li>
<li>Destaque 3</li>
</ul>
<p style="text-align:center">Esperamos por si!</p>`;

const channelOptions = [
  { value: "email", label: "E-mail", icon: Mail, desc: "Newsletter, promoções e comunicações HTML" },
  { value: "sms", label: "SMS", icon: MessageCircle, desc: "Mensagens curtas de texto (160 caracteres)" },
  { value: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon as any, desc: "Mensagens via WhatsApp Business" },
];

const statusActions: Record<string, { label: string; icon: any; next: string; variant?: string }[]> = {
  draft: [
    { label: "Enviar Campanha", icon: Send, next: "sending" },
  ],
  scheduled: [
    { label: "Enviar Agora", icon: Play, next: "sending" },
    { label: "Cancelar Agendamento", icon: Square, next: "draft" },
  ],
  sending: [
    { label: "Pausar Envio", icon: Pause, next: "paused" },
    { label: "Cancelar Envio", icon: Square, next: "cancelled", variant: "destructive" },
  ],
  paused: [
    { label: "Retomar Envio", icon: Play, next: "sending" },
    { label: "Cancelar Envio", icon: Square, next: "cancelled", variant: "destructive" },
  ],
  sent: [
    { label: "Reenviar Campanha", icon: RotateCcw, next: "sending" },
  ],
  failed: [
    { label: "Tentar Novamente", icon: RotateCcw, next: "sending" },
  ],
  cancelled: [
    { label: "Reativar Campanha", icon: RotateCcw, next: "draft" },
  ],
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  scheduled: { label: "Agendada", variant: "outline" },
  sending: { label: "A enviar...", variant: "default" },
  sent: { label: "Enviada", variant: "default" },
  paused: { label: "Pausada", variant: "outline" },
  failed: { label: "Falhou", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "secondary" },
};

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function ScheduleDateTimePicker({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
}) {
  const parsed = value ? new Date(value) : null;
  const selectedDate = parsed && !isNaN(parsed.getTime()) ? parsed : undefined;
  const selectedHour = selectedDate ? String(selectedDate.getHours()).padStart(2, "0") : "09";
  const selectedMinute = selectedDate ? String(Math.floor(selectedDate.getMinutes() / 5) * 5).padStart(2, "0") : "00";

  const buildValue = (date: Date | undefined, hour: string, minute: string) => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(parseInt(hour), parseInt(minute), 0, 0);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={`justify-start text-left font-normal flex-1 ${!selectedDate ? "text-muted-foreground" : ""}`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: pt }) : "Selecionar data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => onChange(buildValue(date, selectedHour, selectedMinute))}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      {selectedDate && (
        <>
          <Select value={selectedHour} onValueChange={(h) => onChange(buildValue(selectedDate, h, selectedMinute))} disabled={disabled}>
            <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
            <SelectContent>{hours.map((h) => <SelectItem key={h} value={h}>{h}h</SelectItem>)}</SelectContent>
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select value={selectedMinute} onValueChange={(m) => onChange(buildValue(selectedDate, selectedHour, m))} disabled={disabled}>
            <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
            <SelectContent>{minutes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onChange(null)} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export default function CampaignEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isNew = !id;

  const [campaign, setCampaign] = useState<Campaign>({
    ...defaultCampaign,
    channel: searchParams.get("canal") || "email",
  });
  const [activeTab, setActiveTab] = useState("config");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [statusAction, setStatusAction] = useState<{ label: string; next: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load existing campaign
  const { isLoading } = useQuery({
    queryKey: ["campaign", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setCampaign(data as any);
      return data;
    },
  });

  // Load clinic settings
  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings-marketing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_settings")
        .select("clinic_name, sms_sender_name, phone, address")
        .limit(1)
        .single();
      return data;
    },
  });

  const { data: emailSettings } = useQuery({
    queryKey: ["marketing-email-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["email_from_address", "email_reply_to"]);
      if (error) throw error;

      return (data || []).reduce<Record<string, string>>((acc, item) => {
        acc[item.setting_key] = item.setting_value || "";
        return acc;
      }, {});
    },
  });

  // Load booking settings for CTA URL default
  const { data: bookingSettings } = useQuery({
    queryKey: ["booking-settings-marketing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("booking_page_settings")
        .select("social_website")
        .limit(1)
        .single();
      return data;
    },
  });

  // Count recipients
  const { data: audienceCounts } = useQuery({
    queryKey: ["campaign-audience-counts"],
    queryFn: async () => {
      const { count: allOptIn } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("opt_in", true);
      const { count: allTotal } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true });
      return { all_optin: allOptIn || 0, all_total: allTotal || 0 };
    },
  });

  const defaultSenderName = clinicSettings?.sms_sender_name || clinicSettings?.clinic_name || "CLINICA";
  const [customSenderName, setCustomSenderName] = useState<string | null>(null);
  const senderName = customSenderName !== null ? customSenderName : defaultSenderName;

  const update = (patch: Partial<Campaign>) => {
    setCampaign((prev) => ({ ...prev, ...patch }));
  };

  // Set default template for new email campaigns
  useEffect(() => {
    if (isNew && campaign.channel === "email" && !campaign.content) {
      update({ content: defaultEmailTemplate });
    }
  }, [isNew, campaign.channel]);

  const saveCampaign = async (showToast = true) => {
    setSaving(true);
    try {
      const payload: any = { ...campaign };
      delete payload.id;
      if (isNew) {
        payload.created_by = user?.id;
        const { data, error } = await supabase
          .from("campaigns")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        if (showToast) toast.success("Campanha criada.");
        navigate(`/marketing/${data.id}`, { replace: true });
        return data.id;
      } else {
        const { error } = await supabase
          .from("campaigns")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        if (showToast) toast.success("Campanha guardada.");
        return id;
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gravar.");
      return null;
    } finally {
      setSaving(false);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    }
  };

  const sendCampaign = async (testOnly = false, recipientOverride?: string) => {
    setSending(true);
    try {
      const campaignId = await saveCampaign(false);
      if (!campaignId) return;
      const body: Record<string, unknown> = { campaign_id: campaignId, test_only: testOnly };
      if (testOnly && recipientOverride) body.test_recipient = recipientOverride;
      if (campaign.channel !== "email" && customSenderName !== null) body.sender_name_override = customSenderName;
      const { error } = await invokeEdgeFunction("send-campaign", { body });
      if (error) throw error;
      toast.success(testOnly ? "Teste enviado!" : "Campanha enviada!");
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (nextStatus === "sending") {
      await sendCampaign(false);
    } else {
      try {
        const { error } = await supabase
          .from("campaigns")
          .update({ status: nextStatus })
          .eq("id", id);
        if (error) throw error;
        update({ status: nextStatus });
        toast.success("Estado atualizado.");
        queryClient.invalidateQueries({ queryKey: ["campaign", id] });
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      } catch (err: any) {
        toast.error(err.message || "Erro ao alterar estado.");
      }
    }
    setStatusAction(null);
  };

  const handleOpenTestDialog = () => {
    setTestRecipient(campaign.channel === "email" ? (user?.email || "") : "");
    setTestDialogOpen(true);
  };

  const getMissingTestFields = () => {
    const template = `${campaign.subject || ""} ${campaign.content || ""}`;
    const placeholders = new Set((template.match(/\{[a-z_]+\}/gi) || []).map((item) => item.toLowerCase()));
    const missing: string[] = [];
    const clinicEmail = emailSettings?.email_from_address || emailSettings?.email_reply_to || "";

    if (placeholders.has("{telefone}") && campaign.channel === "email") {
      missing.push("telefone do cliente");
    }

    if (placeholders.has("{email}") && campaign.channel !== "email") {
      missing.push("e-mail do cliente");
    }

    if (placeholders.has("{negocio_telefone}") && !clinicSettings?.phone?.trim()) {
      missing.push("telefone do negócio");
    }

    if (placeholders.has("{negocio_email}") && !clinicEmail.trim()) {
      missing.push("e-mail do negócio");
    }

    if (placeholders.has("{negocio_endereco}") && !clinicSettings?.address?.trim()) {
      missing.push("endereço do negócio");
    }

    return missing;
  };

  const handleConfirmTest = () => {
    if (!testRecipient.trim()) {
      toast.error("Preencha o destinatário.");
      return;
    }

    const missingFields = getMissingTestFields();
    if (missingFields.length > 0) {
      toast.error(`Faltam dados para o teste: ${missingFields.join(", ")}.`);
      return;
    }

    setTestDialogOpen(false);
    sendCampaign(true, testRecipient.trim());
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `campaign-images/${Date.now()}.${ext}`;
      const { error: upError } = await storage
        .from("campaign-images")
        .upload(path, file, { upsert: true });
      if (upError) throw upError;
      const { data: urlData } = storage
        .from("campaign-images")
        .getPublicUrl(path);
      update({ header_image_url: urlData.publicUrl });
      toast.success("Imagem carregada.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar imagem.");
    } finally {
      setUploadingImage(false);
    }
  };

  const channelLabel = campaign.channel === "email" ? "E-mail" : campaign.channel === "sms" ? "SMS" : "WhatsApp";
  const channelIcon = campaign.channel === "email" ? <Mail className="w-5 h-5" /> : campaign.channel === "sms" ? <MessageCircle className="w-5 h-5" /> : <WhatsAppIcon className="w-5 h-5" />;
  const sc = statusConfig[campaign.status] || statusConfig.draft;
  const actions = statusActions[campaign.status] || [];
  const isEditable = ["draft", "scheduled", "cancelled"].includes(campaign.status);
  const recipientCount = campaign.include_no_optin ? (audienceCounts?.all_total || 0) : (audienceCounts?.all_optin || 0);

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/marketing")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              {channelIcon}
              {isNew ? "Nova Campanha" : campaign.name || "Campanha"}
              {!isNew && (
                <Badge variant={sc.variant} className="ml-2">
                  {sc.label}
                </Badge>
              )}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status controls for existing campaigns */}
          {!isNew && actions.map((action) => (
            <Button
              key={action.next}
              variant={action.variant === "destructive" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setStatusAction({ label: action.label, next: action.next })}
              disabled={sending}
              className="gap-1.5"
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Button>
          ))}
          {isEditable && (
            <>
              <Button variant="outline" size="sm" onClick={handleOpenTestDialog} disabled={sending || !campaign.content} className="gap-1.5">
                <Send className="w-4 h-4" /> Enviar Teste
              </Button>
              <Button variant="outline" size="sm" onClick={() => saveCampaign()} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings className="w-3.5 h-3.5" /> Configuração
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Conteúdo
          </TabsTrigger>
          <TabsTrigger value="audience" className="gap-1.5">
            <Users className="w-3.5 h-3.5" /> Audiência ({recipientCount})
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: CONFIGURAÇÃO ── */}
        <TabsContent value="config" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> Tipo de Campanha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RadioGroup
                  value={campaign.channel}
                  onValueChange={(v) => {
                    const wasEmail = campaign.channel === "email";
                    const isEmail = v === "email";
                    if (isEmail && !wasEmail) {
                      // Switching TO email — set default HTML template
                      update({ channel: v, content: defaultEmailTemplate });
                    } else if (!isEmail && wasEmail) {
                      // Switching FROM email — clear HTML content
                      update({ channel: v, content: "" });
                    } else {
                      update({ channel: v });
                    }
                  }}
                  disabled={!isEditable}
                  className="space-y-2"
                >
                  {channelOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                        campaign.channel === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} />
                      <opt.icon className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Card 2: Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome da Campanha</Label>
                  <Input
                    placeholder="Ex: Promoção Dia da Mãe"
                    value={campaign.name}
                    onChange={(e) => update({ name: e.target.value })}
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data e hora de envio (opcional)</Label>
                  <ScheduleDateTimePicker
                    value={campaign.scheduled_at}
                    onChange={(v) => update({ scheduled_at: v })}
                    disabled={!isEditable}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Deixe vazio para envio imediato.
                  </p>
                </div>
                {campaign.channel === "email" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Assunto do e-mail</Label>
                    <Input
                      placeholder="Assunto do e-mail"
                      value={campaign.subject}
                      onChange={(e) => update({ subject: e.target.value })}
                      disabled={!isEditable}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Remetente</Label>
                  {campaign.channel === "sms" ? (
                    <Input
                      value={senderName}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 11);
                        setCustomSenderName(v);
                      }}
                      maxLength={11}
                      placeholder="Máx 11 alfanuméricos"
                    />
                  ) : (
                    <div className="w-full min-h-[40px] rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground">
                      {clinicSettings?.clinic_name || "—"}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {campaign.channel === "sms"
                      ? "Máx. 11 caracteres alfanuméricos (A-Z, 0-9)."
                      : "Configurado nas definições da clínica."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Summary / Anti-block */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Canal</span>
                    <span className="font-medium flex items-center gap-1.5">
                      {channelIcon} {channelLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Destinatários</span>
                    <span className="font-medium">{recipientCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estado</span>
                    <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                  </div>
                  {campaign.scheduled_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Agendado</span>
                      <span className="font-medium text-xs">
                        {new Date(campaign.scheduled_at).toLocaleString("pt-PT", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sending controls — WhatsApp only */}
                {isEditable && campaign.channel === "whatsapp" && (
                  <div className="space-y-3 border-t pt-3">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Controle de envio
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Intervalo (seg)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={120}
                          value={campaign.send_delay_seconds}
                          onChange={(e) => update({ send_delay_seconds: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Por lote</Label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={campaign.batch_size}
                          onChange={(e) => update({ batch_size: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    {(() => {
                      const delay = campaign.send_delay_seconds || 30;
                      const safe = delay >= 30;
                      return (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className={cn(
                                "text-[11px] font-medium cursor-help",
                                safe ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                              )}>
                                {safe
                                  ? `✓ Intervalo seguro (${delay}s)`
                                  : `⚠ Intervalo curto (${delay}s) — risco de bloqueio do WhatsApp`}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">
                                Recomendado: ≥ 30 segundos entre envios. Valores menores podem
                                resultar em bloqueio temporário ou banimento do número WhatsApp.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })()}
                    {recipientCount > 0 && (
                      <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                        {(() => {
                          const batches = Math.ceil(recipientCount / (campaign.batch_size || 1));
                          const totalSeconds = batches * (campaign.send_delay_seconds || 30);
                          const mins = Math.floor(totalSeconds / 60);
                          const secs = totalSeconds % 60;
                          const baseTime = campaign.scheduled_at ? new Date(campaign.scheduled_at).getTime() : Date.now();
                          const endTime = new Date(baseTime + totalSeconds * 1000);
                          return (
                            <>
                              <p><strong>{batches}</strong> lotes · ≈ <strong>{mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}</strong></p>
                              <p>Término estimado: <strong>{endTime.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</strong></p>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB: CONTEÚDO ── */}
        <TabsContent value="content" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
            {/* Left: Editor */}
            <div className="space-y-5">
              {campaign.channel === "email" ? (
                <>
                  {/* Header image */}
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" /> Imagem de cabeçalho
                        </Label>
                        <Switch
                          checked={campaign.show_header_image}
                          onCheckedChange={(v) => update({ show_header_image: v })}
                          disabled={!isEditable}
                        />
                      </div>
                      {campaign.show_header_image && (
                        <div className="space-y-2">
                          {campaign.header_image_url ? (
                            <div className="relative rounded-lg overflow-hidden bg-muted aspect-[2/1]">
                              <img
                                src={campaign.header_image_url}
                                alt="Header"
                                className="w-full h-full object-cover"
                              />
                              <Button
                                variant="secondary"
                                size="sm"
                                className="absolute bottom-2 right-2 text-xs"
                                onClick={() => update({ header_image_url: "" })}
                              >
                                Remover
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                placeholder="URL da imagem"
                                value={campaign.header_image_url}
                                onChange={(e) => update({ header_image_url: e.target.value })}
                                className="flex-1"
                              />
                              <label className="shrink-0">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleImageUpload}
                                />
                                <Button variant="outline" size="sm" asChild disabled={uploadingImage}>
                                  <span>
                                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                    Upload
                                  </span>
                                </Button>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* HTML Editor */}
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Pencil className="w-4 h-4" /> Conteúdo do E-mail (HTML)
                      </Label>
                      <RichEditor
                        value={campaign.content}
                        onChange={(html) => update({ content: html })}
                        placeholder="Escreva o conteúdo do seu e-mail..."
                        className="min-h-[300px]"
                      />
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Variáveis disponíveis (clique para inserir):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { tag: "{nome}", desc: "Nome do cliente" },
                            { tag: "{email}", desc: "E-mail do cliente" },
                            { tag: "{telefone}", desc: "Telefone do cliente" },
                            { tag: "{negocio}", desc: "Nome da clínica" },
                            { tag: "{negocio_telefone}", desc: "Telefone da clínica" },
                            { tag: "{negocio_email}", desc: "E-mail da clínica" },
                            { tag: "{negocio_endereco}", desc: "Endereço da clínica" },
                          ].map((v) => (
                            <button
                              key={v.tag}
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                              title={v.desc}
                              onClick={() => {
                                const current = campaign.content || "";
                                update({ content: current + v.tag });
                              }}
                            >
                              {v.tag}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Serão substituídas pelo valor real de cada destinatário no momento do envio.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* CTA Button */}
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Botão CTA</Label>
                        <Switch
                          checked={!!campaign.cta_text}
                          onCheckedChange={(v) =>
                            update({
                              cta_text: v ? "Marque agora" : "",
                              cta_url: v ? (bookingSettings?.social_website || "") : "",
                            })
                          }
                          disabled={!isEditable}
                        />
                      </div>
                      {campaign.cta_text && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Texto do botão</Label>
                            <Input
                              value={campaign.cta_text}
                              onChange={(e) => update({ cta_text: e.target.value })}
                              disabled={!isEditable}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Link do botão</Label>
                            <Input
                              value={campaign.cta_url}
                              onChange={(e) => update({ cta_url: e.target.value })}
                              placeholder="https://..."
                              disabled={!isEditable}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* SMS / WhatsApp editor */
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Pencil className="w-4 h-4" /> Mensagem {campaign.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                    </Label>
                    <Textarea
                      placeholder="A sua mensagem..."
                      value={campaign.content}
                      onChange={(e) => update({ content: e.target.value })}
                      rows={8}
                      className="resize-y"
                      disabled={!isEditable}
                    />
                    <p className="text-xs text-muted-foreground">
                      {campaign.content.length}{campaign.channel === "sms" ? " / 160 caracteres" : " caracteres"}
                    </p>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Variáveis disponíveis (clique para inserir):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { tag: "{nome}", desc: "Nome do cliente" },
                          { tag: "{email}", desc: "E-mail do cliente" },
                          { tag: "{telefone}", desc: "Telefone do cliente" },
                          { tag: "{negocio}", desc: "Nome da clínica" },
                          { tag: "{negocio_telefone}", desc: "Telefone da clínica" },
                          { tag: "{negocio_email}", desc: "E-mail da clínica" },
                          { tag: "{negocio_endereco}", desc: "Endereço da clínica" },
                        ].map((v) => (
                          <button
                            key={v.tag}
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            title={v.desc}
                            onClick={() => {
                              const current = campaign.content || "";
                              update({ content: current + v.tag });
                            }}
                          >
                            {v.tag}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Serão substituídas pelo valor real de cada destinatário no momento do envio.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Preview */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-3">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Pré-visualização
                </Label>
                {campaign.channel === "email" ? (
                  <CampaignEmailPreview
                    subject={campaign.subject}
                    senderName={clinicSettings?.clinic_name || "Clínica"}
                    title={campaign.subject}
                    body={campaign.content}
                    showImage={campaign.show_header_image}
                    imageUrl={campaign.header_image_url}
                    ctaText={campaign.cta_text}
                    ctaUrl={campaign.cta_url}
                  />
                ) : (
                  <CampaignSmsPreview
                    senderName={senderName}
                    message={campaign.content}
                    isWhatsApp={campaign.channel === "whatsapp"}
                  />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: AUDIÊNCIA ── */}
        <TabsContent value="audience" className="mt-4">
          <CampaignAudienceTab
            channel={campaign.channel}
            audienceFilter={campaign.audience_filter}
            includeNoOptin={campaign.include_no_optin}
            onChangeFilter={(f) => update({ audience_filter: f })}
            onChangeOptin={(v) => update({ include_no_optin: v })}
          />
        </TabsContent>
      </Tabs>

      {/* Test Send Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enviar Teste</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm">
              {campaign.channel === "email" ? "E-mail do destinatário" : "Telefone do destinatário"}
            </Label>
            {campaign.channel === "email" ? (
              <Input
                placeholder="email@exemplo.com"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                type="email"
              />
            ) : (
              <PhoneInput
                value={testRecipient}
                onChange={setTestRecipient}
                placeholder="912 345 678"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmTest} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status change confirmation */}
      <AlertDialog open={!!statusAction} onOpenChange={(o) => !o && setStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja {statusAction?.label.toLowerCase()}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => statusAction && handleStatusChange(statusAction.next)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Megaphone,
  Plus,
  Mail,
  MessageCircle,
  Users,
  Send,
  Clock,
  Star,
  History,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Loader2,
  Bot,
  Save,
  Cake,
  UserX,
  Repeat2,
  ThumbsUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import GoogleReviewsTab from "@/components/marketing/GoogleReviewsTab";
import { toast } from "sonner";
import { fmtDateShort } from "@/lib/date";

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  sms: <MessageCircle className="w-4 h-4" />,
  whatsapp: <WhatsAppIcon className="w-4 h-4" />,
};

const channelLabels: Record<string, string> = {
  email: "E-mail",
  sms: "SMS",
  whatsapp: "WhatsApp",
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

// ─── Automações tab ─────────────────────────────────────────────────────────

function AutomacoesTab() {
  const [birthdayEnabled, setBirthdayEnabled] = useState(true);
  const [inactiveEnabled, setInactiveEnabled] = useState(true);
  const [posAtendimentoEnabled, setPosAtendimentoEnabled] = useState(false);
  const [inactivityDays, setInactivityDays] = useState(90);
  const [intervalDays, setIntervalDays] = useState(30);
  const [savingInterval, setSavingInterval] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("clinic_settings")
        .select("inactivity_days, inactive_notification_interval_days")
        .limit(1)
        .single();
      if (data) {
        if (data.inactivity_days) setInactivityDays(data.inactivity_days);
        if (data.inactive_notification_interval_days) setIntervalDays(data.inactive_notification_interval_days);
      }
      const { data: settings } = await supabase
        .from("integration_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["n8n_webhook_enabled_birthday", "n8n_webhook_enabled_inactive"]);
      if (settings) {
        settings.forEach((s: any) => {
          if (s.setting_key === "n8n_webhook_enabled_birthday") setBirthdayEnabled(s.setting_value !== "false");
          if (s.setting_key === "n8n_webhook_enabled_inactive") setInactiveEnabled(s.setting_value !== "false");
        });
      }
    }
    load();
  }, []);

  const toggleWebhook = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    await supabase.from("integration_settings").upsert(
      { setting_key: key, setting_value: String(value) },
      { onConflict: "setting_key" }
    );
    toast.success(value ? "Automação ativada" : "Automação desativada");
  };

  const saveIntervalDays = async () => {
    setSavingInterval(true);
    await supabase.from("clinic_settings")
      .update({ inactive_notification_interval_days: intervalDays } as any)
      .neq("id", "00000000-0000-0000-0000-000000000000");
    setSavingInterval(false);
    toast.success("Intervalo salvo.");
  };

  const automacoes = [
    {
      key: "birthday",
      icon: <Cake className="w-5 h-5 text-pink-500" />,
      label: "🎂 Aniversariantes",
      desc: "Mensagem automática no dia do aniversário do cliente",
      enabled: birthdayEnabled,
      setter: setBirthdayEnabled,
      webhookKey: "n8n_webhook_enabled_birthday",
    },
    {
      key: "inactive",
      icon: <UserX className="w-5 h-5 text-orange-500" />,
      label: "💤 Clientes Inativos",
      desc: `Mensagem para clientes sem visita há mais de ${inactivityDays} dias`,
      enabled: inactiveEnabled,
      setter: setInactiveEnabled,
      webhookKey: "n8n_webhook_enabled_inactive",
    },
    {
      key: "pos_atendimento",
      icon: <ThumbsUp className="w-5 h-5 text-green-500" />,
      label: "⭐ Pós-atendimento",
      desc: "Solicitar avaliação e indicar próximo retorno após o atendimento",
      enabled: posAtendimentoEnabled,
      setter: setPosAtendimentoEnabled,
      webhookKey: "n8n_webhook_enabled_pos_atendimento",
      badge: "Em breve",
    },
    {
      key: "retorno",
      icon: <Repeat2 className="w-5 h-5 text-blue-500" />,
      label: "🔁 Serviço não continuado",
      desc: "Aviso automático quando o cliente não retornou para um serviço recorrente (ex: botox > 4 meses)",
      enabled: false,
      setter: () => {},
      webhookKey: "",
      badge: "Em breve",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Bot className="w-4 h-4" />
        <p className="text-sm">Mensagens disparadas automaticamente por gatilho de tempo ou comportamento do cliente.</p>
      </div>

      {automacoes.map((a) => (
        <Card key={a.key} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{a.icon}</div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{a.label}</p>
                  {a.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{a.badge}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
            </div>
            <Switch
              checked={a.enabled}
              disabled={!!a.badge}
              onCheckedChange={(v) => a.webhookKey && toggleWebhook(a.webhookKey, v, a.setter)}
            />
          </div>
        </Card>
      ))}

      {/* Controle de reenvio para inativos */}
      {inactiveEnabled && (
        <Card className="p-5 space-y-3">
          <Label className="text-sm font-semibold text-muted-foreground">Intervalo de reenvio — Clientes Inativos</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={365}
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">dias entre reenvios para o mesmo cliente</span>
            <Button size="sm" variant="outline" onClick={saveIntervalDays} disabled={savingInterval}>
              {savingInterval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Padrão: 30 dias.</p>
        </Card>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Marketing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState("campanhas");
  const [channelFilter, setChannelFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", channelFilter],
    queryFn: async () => {
      let q = supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (channelFilter !== "all") q = q.eq("channel", channelFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: channelFilter !== "reviews",
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete recipients first
      await supabase.from("campaign_recipients").delete().eq("campaign_id", deleteTarget);
      const { error } = await supabase.from("campaigns").delete().eq("id", deleteTarget);
      if (error) throw error;
      toast.success("Campanha eliminada.");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao eliminar.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = async (campaign: any) => {
    try {
      const { id, created_at, updated_at, sent_at, scheduled_at, recipient_count, status, ...rest } = campaign;
      const { error } = await supabase.from("campaigns").insert({
        ...rest,
        name: `${campaign.name || "Campanha"} (cópia)`,
        status: "draft",
        recipient_count: 0,
      });
      if (error) throw error;
      toast.success("Campanha duplicada.");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao duplicar.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={<Megaphone className="w-5 h-5" />} title="Marketing" subtitle="Campanhas, automações e avaliações." />

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="campanhas" className="gap-1.5">
            <Send className="w-3.5 h-3.5" /> Campanhas
          </TabsTrigger>
          <TabsTrigger value="automacoes" className="gap-1.5">
            <Bot className="w-3.5 h-3.5" /> Automações
          </TabsTrigger>
          <TabsTrigger value="avaliacoes" className="gap-1.5">
            <Star className="w-3.5 h-3.5" /> Avaliações Google
          </TabsTrigger>
        </TabsList>

        {/* ── CAMPANHAS ── */}
        <TabsContent value="campanhas" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Tabs value={channelFilter} onValueChange={setChannelFilter}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="email" className="gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> E-mail
                </TabsTrigger>
                <TabsTrigger value="sms" className="gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> SMS
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="gap-1.5">
                  <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/marketing/historico")} className="gap-2">
                <History className="w-4 h-4" /> Histórico
              </Button>
              <Button onClick={() => navigate("/marketing/nova")} className="gap-2">
                <Plus className="w-4 h-4" /> Nova Campanha
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : !campaigns?.length ? (
            <Card className="p-12 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Nenhuma campanha criada.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/marketing/nova")}>
                <Plus className="w-4 h-4" /> Criar primeira campanha
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c: any) => {
                const sc = statusConfig[c.status] || statusConfig.draft;
                return (
                  <Card
                    key={c.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/marketing/${c.id}`)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-muted">
                          {channelIcons[c.channel]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {c.name || "Sem nome"}
                            </p>
                            <Badge variant={sc.variant} className="text-[10px] shrink-0">
                              {sc.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              {channelIcons[c.channel]}
                              {channelLabels[c.channel]}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {c.recipient_count || 0} destinatários
                            </span>
                            {c.scheduled_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {fmtDateShort(c.scheduled_at)}
                              </span>
                            )}
                            {c.sent_at && (
                              <span className="flex items-center gap-1">
                                <Send className="w-3 h-3" />
                                Enviada {fmtDateShort(c.sent_at)}
                              </span>
                            )}
                            {!c.scheduled_at && !c.sent_at && c.created_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Criada {fmtDateShort(c.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => navigate(`/marketing/${c.id}`)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(c)}>
                            <Copy className="w-4 h-4 mr-2" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(c.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── AUTOMAÇÕES ── */}
        <TabsContent value="automacoes" className="mt-4">
          <AutomacoesTab />
        </TabsContent>

        {/* ── AVALIAÇÕES ── */}
        <TabsContent value="avaliacoes" className="mt-4">
          <GoogleReviewsTab />
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. A campanha e todos os registos de envio associados serão eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

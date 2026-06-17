import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Bell, MessageCircle, Settings2, Save, Clock, Users, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Template {
  id: string;
  slug: string;
  label: string;
  content: string;
}

const SMS_SLUGS = [
  "booking_confirmed_sms",
  "booking_changed_sms",
  "booking_cancelled_sms",
  "booking_reminder_sms",
  "birthday_sms",
  "inactive_sms",
];

const WHATSAPP_SLUGS = [
  "booking_confirmed_whatsapp",
  "booking_changed_whatsapp",
  "booking_cancelled_whatsapp",
  "booking_reminder_whatsapp",
  "birthday_whatsapp",
  "inactive_whatsapp",
];

const VARIABLES = [
  { var: "{nome}", desc: "nome do cliente" },
  { var: "{negocio}", desc: "nome do negócio" },
  { var: "{data}", desc: "data da marcação" },
  { var: "{servico}", desc: "nome do serviço" },
  { var: "{especialista}", desc: "nome do especialista" },
  { var: "{horario}", desc: "horário da marcação" },
  { var: "{link_agendamento}", desc: "link de agendamento online" },
  { var: "{link_cancelamento}", desc: "link de cancelamento do agendamento" },
  { var: "{link_unsubscribe}", desc: "link para cancelar recebimento de notificações" },
  { var: "{link_site}", desc: "link do website" },
  { var: "{link_instagram}", desc: "link do Instagram" },
  { var: "{link_facebook}", desc: "link do Facebook" },
  { var: "{telefone}", desc: "telefone da clínica" },
];

const EMAIL_SYSTEM_SLUGS = [
  "welcome",
  "recovery",
  "inactive_client",
];

export default function NotificationsTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [intervalDays, setIntervalDays] = useState<number>(30);
  const [savingInterval, setSavingInterval] = useState(false);

  const EMAIL_NOTIFICATION_SLUGS = [
    "booking_confirmed_email",
    "booking_changed_email",
    "booking_cancelled_email",
    "booking_reminder_email",
    "birthday_email",
    "inactive_email",
  ];

  const STAFF_EMAIL_SLUGS = [
    "staff_booking_confirmed_email",
    "staff_booking_cancelled_email",
    "staff_booking_changed_email",
  ];

  const { isLoading } = useQuery({
    queryKey: ["notification-templates-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("message_templates").select("*").order("slug");
      if (error) throw error;
      setTemplates(data as Template[]);
      return data;
    },
  });

  useQuery({
    queryKey: ["notification-enabled-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("notification_settings").select("*");
      const existingKeys = new Set((data ?? []).map((s: any) => s.setting_key));
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((s: any) => { map[s.setting_key] = s.enabled; });

      // Auto-seed missing records with enabled=true
      const allSlugs = [...SMS_SLUGS, ...WHATSAPP_SLUGS];
      const missing = allSlugs.filter((s) => !existingKeys.has(s));
      if (missing.length > 0) {
        const rows = missing.map((slug) => {
          const channel = slug.endsWith("_sms") ? "sms" : "whatsapp";
          return { setting_key: slug, enabled: true, channel };
        });
        await supabase.from("notification_settings").upsert(rows, { onConflict: "setting_key" });
        rows.forEach((r) => { map[r.setting_key] = true; });
      }

      setEnabledMap((prev) => ({ ...prev, ...map }));
      return data;
    },
  });

  const [staffEmailEnabled, setStaffEmailEnabled] = useState(true);

  const { data: inactivityDays } = useQuery({
    queryKey: ["clinic-inactivity-days"],
    queryFn: async () => {
      const { data } = await supabase.from("clinic_settings").select("inactivity_days, inactive_notification_interval_days, reminder_lead").limit(1).single();
      const d = data as any;
      setIntervalDays(d?.inactive_notification_interval_days ?? 30);
      setReminderLead(d?.reminder_lead ?? "24h");
      return d?.inactivity_days ?? 90;
    },
  });

  const [reminderLead, setReminderLead] = useState("24h");
  const [birthdayEnabled, setBirthdayEnabled] = useState(true);
  const [inactiveEnabled, setInactiveEnabled] = useState(true);

  useQuery({
    queryKey: ["webhook-toggles"],
    queryFn: async () => {
      const { data } = await supabase.from("integration_settings").select("setting_key, setting_value")
        .in("setting_key", ["n8n_webhook_enabled_birthday", "n8n_webhook_enabled_inactive"]);
      (data ?? []).forEach((s: any) => {
        if (s.setting_key === "n8n_webhook_enabled_birthday") setBirthdayEnabled(s.setting_value !== "false");
        if (s.setting_key === "n8n_webhook_enabled_inactive") setInactiveEnabled(s.setting_value !== "false");
      });
      return data;
    },
  });

  const toggleWebhook = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    await supabase.from("integration_settings").upsert({ setting_key: key, setting_value: String(value) } as any, { onConflict: "setting_key" });
  };

  const saveReminderLead = async (val: string) => {
    setReminderLead(val);
    await supabase.from("clinic_settings").update({ reminder_lead: val } as any).neq("id", "00000000-0000-0000-0000-000000000000");
    toast.success("Antecedência de lembrete salva.");
  };

  useQuery({
    queryKey: ["staff-booking-email-setting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_settings")
        .select("enabled")
        .eq("setting_key", "staff_booking_email")
        .maybeSingle();
      if (data) {
        setStaffEmailEnabled(data.enabled);
      } else {
        await supabase.from("notification_settings").upsert(
          { setting_key: "staff_booking_email", enabled: true, channel: "email" },
          { onConflict: "setting_key" }
        );
        setStaffEmailEnabled(true);
      }
      return data;
    },
  });

  const toggleStaffEmail = async (checked: boolean) => {
    const prev = staffEmailEnabled;
    setStaffEmailEnabled(checked);
    const { error } = await supabase
      .from("notification_settings")
      .upsert({ setting_key: "staff_booking_email", enabled: checked, channel: "email" }, { onConflict: "setting_key" });
    if (error) {
      setStaffEmailEnabled(prev);
      toast.error("Erro ao atualizar configuração.");
    } else {
      queryClient.invalidateQueries({ queryKey: ["staff-booking-email-setting"] });
    }
  };

  const updateContent = (id: string, content: string) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)));
  };

  const toggleEnabled = async (slug: string, checked: boolean) => {
    const previousValue = enabledMap[slug] ?? true;
    setEnabledMap((prev) => ({ ...prev, [slug]: checked }));

    const channel = slug.endsWith("_sms") ? "sms" : "whatsapp";
    const { error } = await supabase
      .from("notification_settings")
      .upsert(
        { setting_key: slug, enabled: checked, channel },
        { onConflict: "setting_key" }
      );

    if (error) {
      setEnabledMap((prev) => ({ ...prev, [slug]: previousValue }));
      toast.error("Erro ao atualizar status da notificação.");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["notification-enabled-settings"] });
  };

  const saveTemplate = async (template: Template) => {
    setSaving(template.id);
    const { error } = await supabase
      .from("message_templates")
      .update({ content: template.content })
      .eq("id", template.id);
    if (error) toast.error("Erro ao salvar.");
    else toast.success("Mensagem salva.");
    setSaving(null);
  };

  const smsTemplates = templates.filter((t) => SMS_SLUGS.includes(t.slug));
  const whatsappTemplates = templates.filter((t) => WHATSAPP_SLUGS.includes(t.slug));
  const generalTemplates = templates.filter(
    (t) => !SMS_SLUGS.includes(t.slug) && !WHATSAPP_SLUGS.includes(t.slug) && !EMAIL_NOTIFICATION_SLUGS.includes(t.slug) && !EMAIL_SYSTEM_SLUGS.includes(t.slug) && !STAFF_EMAIL_SLUGS.includes(t.slug)
  );

  const saveAll = async () => {
    setSavingAll(true);
    try {
      const allFiltered = [...smsTemplates, ...whatsappTemplates, ...generalTemplates];
      for (const t of allFiltered) {
        await supabase.from("message_templates").update({ content: t.content }).eq("id", t.id);
      }
      toast.success("Todas as configurações salvas.");
      queryClient.invalidateQueries({ queryKey: ["notification-templates-all"] });
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSavingAll(false);
    }
  };

  const saveIntervalDays = async () => {
    setSavingInterval(true);
    const { error } = await supabase
      .from("clinic_settings")
      .update({ inactive_notification_interval_days: intervalDays } as any)
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) toast.error("Erro ao salvar intervalo.");
    else {
      toast.success("Intervalo de reenvio atualizado.");
      queryClient.invalidateQueries({ queryKey: ["clinic-inactivity-days"] });
    }
    setSavingInterval(false);
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  }

  const INACTIVE_SLUGS = ["inactive_sms", "inactive_whatsapp"];
  const isInactiveSlug = (slug: string) => INACTIVE_SLUGS.includes(slug);

  const renderTemplateItem = (t: Template, rows = 3) => (
    <div key={t.id} className="space-y-3 p-4 rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{t.label.replace(/ \(SMS\)| \(WhatsApp\)| \(Email\)/g, "")}</Label>
          {isInactiveSlug(t.slug) && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              Clientes sem visita há mais de <span className="font-medium text-foreground">{inactivityDays ?? 90} dias</span>
               <button
                type="button"
                onClick={() => {
                  const allTriggers = document.querySelectorAll('[role="tab"]');
                  const agendaTab = Array.from(allTriggers).find(
                    (el) => el.textContent?.trim().toLowerCase().includes("agenda")
                  ) as HTMLElement;
                  agendaTab?.click();
                  setTimeout(() => {
                    const inactivityInput = document.querySelector('input[type="number"]') as HTMLElement;
                    if (inactivityInput) {
                      inactivityInput.scrollIntoView({ behavior: "smooth", block: "center" });
                      inactivityInput.focus();
                    }
                  }, 400);
                }}
                className="inline-flex items-center gap-0.5 text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
                title="Alterar dias de inatividade em Agenda"
              >
                <Settings2 className="w-3 h-3" />
                alterar
              </button>
            </p>
          )}
        </div>
        <Switch
          checked={enabledMap[t.slug] ?? true}
          onCheckedChange={(checked) => toggleEnabled(t.slug, checked)}
        />
      </div>
      <Textarea
        rows={rows}
        value={t.content}
        onChange={(e) => updateContent(t.id, e.target.value)}
        className="resize-y text-sm"
        disabled={!(enabledMap[t.slug] ?? true)}
      />
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => saveTemplate(t)} disabled={saving === t.id}>
          {saving === t.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving === t.id ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );

  const variablesBlock = (
    <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
      <p className="font-medium text-foreground text-sm">Variáveis disponíveis:</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {VARIABLES.map((v) => (
          <span key={v.var}>
            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{v.var}</code> {v.desc}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <div className="mb-2">
        <h3 className="text-lg font-light tracking-wider">
          NOTIFICAÇÕES
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Configure as notificações e mensagens enviadas automaticamente aos clientes por SMS e WhatsApp.</p>
      </div>

      {/* Notificações Internas */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <Label className="text-sm font-semibold">Notificações Internas</Label>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-sm font-medium">E-mail para Especialistas e Admins</p>
            <p className="text-xs text-muted-foreground mt-1">
              Controla o envio de e-mail automático quando a <span className="font-medium text-foreground">equipa</span> cria, altera ou cancela uma marcação.
              Agendamentos feitos ou cancelados pelo <span className="font-medium text-foreground">cliente</span> (via página de agendamento online) notificam sempre, independentemente desta configuração.
            </p>
          </div>
          <Switch
            checked={staffEmailEnabled}
            onCheckedChange={toggleStaffEmail}
          />
        </div>
      </Card>

      {/* Antecedência de lembrete */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <Label className="text-sm font-semibold">Lembretes Automáticos</Label>
        </div>
        <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
          <div>
            <p className="text-sm font-medium">Antecedência de lembrete por E-mail e SMS</p>
            <p className="text-xs text-muted-foreground mt-0.5">Com quanto tempo de antecedência enviar o lembrete de agendamento</p>
          </div>
          <Select value={reminderLead} onValueChange={saveReminderLead}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="2h">2h</SelectItem>
              <SelectItem value="4h">4h</SelectItem>
              <SelectItem value="12h">12h</SelectItem>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="48h">48h</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Automações */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <Label className="text-sm font-semibold">Automações</Label>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">🎂 Aniversariantes</p>
              <p className="text-xs text-muted-foreground mt-0.5">Enviar mensagem automática no dia do aniversário</p>
            </div>
            <Switch checked={birthdayEnabled} onCheckedChange={(v) => toggleWebhook("n8n_webhook_enabled_birthday", v, setBirthdayEnabled)} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">💤 Clientes Inativos</p>
              <p className="text-xs text-muted-foreground mt-0.5">Enviar mensagem para clientes sem visita há mais de {inactivityDays ?? 90} dias</p>
            </div>
            <Switch checked={inactiveEnabled} onCheckedChange={(v) => toggleWebhook("n8n_webhook_enabled_inactive", v, setInactiveEnabled)} />
          </div>
        </div>
      </Card>

      {/* Controle de Clientes Inativos */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <Label className="text-sm font-semibold">Clientes Inativos — Controle de Reenvio</Label>
        </div>

        {/* Intervalo de reenvio */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Intervalo mínimo entre reenvios de notificações de inatividade para o mesmo cliente
          </Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={365}
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">dias</span>
            <Button size="sm" variant="outline" onClick={saveIntervalDays} disabled={savingInterval}>
              {savingInterval ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Após enviar uma notificação de inatividade, o sistema aguardará este intervalo antes de reenviar para o mesmo cliente. Padrão: 30 dias.
          </p>
        </div>
      </Card>

      {/* Registros de Lembretes */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-semibold">Registros de Lembretes</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Visualize e gerencie os lembretes agendados no sistema de automação.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/lembretes")} className="gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir
          </Button>
        </div>
      </Card>

      {/* SMS */}
      {smsTemplates.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <Label className="text-sm font-semibold">SMS</Label>
          </div>
          {variablesBlock}
          {smsTemplates.map((t) => renderTemplateItem(t))}
        </Card>
      )}

      {/* WhatsApp */}
      {whatsappTemplates.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <WhatsAppIcon className="w-5 h-5 text-muted-foreground" />
            <Label className="text-sm font-semibold">WhatsApp</Label>
          </div>
          {variablesBlock}
          {whatsappTemplates.map((t) => renderTemplateItem(t, 4))}
        </Card>
      )}

      {/* General messages */}
      {generalTemplates.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <Label className="text-sm font-semibold">Outras Mensagens</Label>
          </div>
          {generalTemplates.map((t) => renderTemplateItem(t, 4))}
        </Card>
      )}

      {/* Save all */}
      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={savingAll}>
          {savingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {savingAll ? "Salvando..." : "Salvar Tudo"}
        </Button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { PhoneInput, timezoneToCountry } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
// calendar feed URL is built inline via getFeedUrl
import { toast } from "sonner";
import { Loader2, CalendarClock, Save, CalendarDays, Copy, Download, RefreshCw, CheckCircle2 } from "lucide-react";

interface ClinicSettings {
  id: string;
  clinic_name: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  min_booking_lead: string;
  max_booking_future: string;
  calendar_slot_interval: string;
  optimize_bookings: string;
  reminder_lead: string;
  show_notes_on_calendar: string;
  hide_off_duty_specialists: string;
  allow_multi_service_booking: boolean;
  inactivity_days: number;
  default_vat_rate: number;
  system_url: string;
  booking_url: string;
  feedback_enabled: boolean;
}

export default function AgendaTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<ClinicSettings>>({});
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["clinic-settings-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code === "PGRST116") {
        const { data: created, error: insertErr } = await supabase
          .from("clinic_settings")
          .insert({})
          .select()
          .single();
        if (insertErr) throw insertErr;
        setForm(created as any);
        return created as unknown as ClinicSettings;
      }
      if (error) throw error;
      setForm(data as any);
      return data as unknown as ClinicSettings;
    },
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!settings?.id) return;
    setSaving(true);
    try {
      const { id, ...rest } = form;
      const { error } = await supabase
        .from("clinic_settings")
        .update(rest as any)
        .eq("id", settings.id);
      if (error) throw error;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clinic-settings-full"] }),
        queryClient.invalidateQueries({ queryKey: ["clinic-settings-sms"] }),
        queryClient.invalidateQueries({ queryKey: ["inactivity-days"] }),
        queryClient.invalidateQueries({ queryKey: ["clinic-inactivity-days"] }),
        queryClient.invalidateQueries({ queryKey: ["default-vat-rate"] }),
      ]);
      toast.success("Configurações salvas.");
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <div className="mb-2">
        <h3 className="text-lg font-light tracking-wider flex items-center gap-2">
          <CalendarClock className="w-5 h-5" /> AGENDA
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Configure as configurações gerais e regras de funcionamento da agenda.</p>
      </div>

      {/* Informações básicas */}
      <Card className="p-5 space-y-4">
        <Label className="text-sm font-semibold">Informações Básicas</Label>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
            <Input value={form.clinic_name || ""} onChange={(e) => update("clinic_name", e.target.value)} placeholder="Nome da clínica" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Telefone</Label>
            <PhoneInput value={form.phone || ""} onChange={(v) => update("phone", v)} defaultCountry={timezoneToCountry(form.timezone || "Europe/Lisbon")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Endereço</Label>
            <Input value={form.address || ""} onChange={(e) => update("address", e.target.value)} placeholder="Rua, número, cidade" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fuso horário</Label>
              <Select value={form.timezone || "Europe/Lisbon"} onValueChange={(v) => update("timezone", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Lisbon">Europe/Lisbon</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                  <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Moeda</Label>
              <Select value={form.currency || "EUR"} onValueChange={(v) => update("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro</SelectItem>
                  <SelectItem value="BRL">Real</SelectItem>
                  <SelectItem value="USD">Dólar</SelectItem>
                  <SelectItem value="GBP">Libra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(() => {
              const tz = form.timezone || "Europe/Lisbon";
              const isBR = tz.startsWith("America/");
              const taxLabel = isBR ? "Imposto padrão (%)" : "Taxa IVA padrão (%)";
              const taxPlaceholder = isBR ? "0" : "23";
              const taxHint = isBR
                ? "Valor pré-preenchido ao criar novos serviços."
                : "Valor pré-preenchido ao criar novos serviços.";
              return (
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{taxLabel}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={(form as any).default_vat_rate ?? (isBR ? 0 : 23)}
                    onChange={(e) => update("default_vat_rate", e.target.value)}
                    placeholder={taxPlaceholder}
                  />
                  <p className="text-[10px] text-muted-foreground">{taxHint}</p>
                </div>
              );
            })()}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL do Sistema</Label>
              <Input value={(form as any).system_url || ""} onChange={(e) => update("system_url", e.target.value)} placeholder="https://system.bellex.pt" />
              <p className="text-[10px] text-muted-foreground">Usado para links de cancelamento, calendário, etc.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL de Agendamento</Label>
              <Input value={(form as any).booking_url || ""} onChange={(e) => update("booking_url", e.target.value)} placeholder="https://agendamento.bellex.pt" />
              <p className="text-[10px] text-muted-foreground">Usado para links de compartilhamento e embed.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "A gravar..." : "Gravar"}
          </Button>
        </div>
      </Card>

      {/* Regras da Agenda */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold">Regras da Agenda</Label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
            <div>
              <p className="text-sm font-medium">Intervalos de tempo do calendário</p>
            </div>
            <Select value={form.calendar_slot_interval || "30m"} onValueChange={(v) => update("calendar_slot_interval", v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10m">10m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="20m">20m</SelectItem>
                <SelectItem value="30m">30m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
            <div>
              <p className="text-sm font-medium">Antecedência de lembrete por E-mail e SMS</p>
            </div>
            <Select value={form.reminder_lead || "24h"} onValueChange={(v) => update("reminder_lead", v)}>
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

          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
            <div>
              <p className="text-sm font-medium">Dias para considerar inativo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Clientes sem visita há mais de {form.inactivity_days || 90} dias serão considerados inativos.</p>
            </div>
            <Input
              type="number"
              min={7}
              max={365}
              className="w-24 text-center"
              value={form.inactivity_days ?? 90}
              onChange={(e) => setForm((prev) => ({ ...prev, inactivity_days: parseInt(e.target.value) || 90 }))}
            />
          </div>

          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
            <div>
              <p className="text-sm font-medium">Marcações de múltiplos serviços</p>
              <p className="text-xs text-muted-foreground mt-0.5">Com esta opção seus clientes podem selecionar vários serviços na mesma marcação.</p>
            </div>
            <Switch
              checked={form.allow_multi_service_booking ?? false}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, allow_multi_service_booking: v }))}
            />
          </div>

          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
            <div>
              <p className="text-sm font-medium">Ativar feedbacks</p>
              <p className="text-xs text-muted-foreground mt-0.5">Quando desativado, o sistema ignora o pedido de avaliação ao concluir atendimentos.</p>
            </div>
            <Switch
              checked={(form as any).feedback_enabled ?? true}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, feedback_enabled: v } as any))}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "A gravar..." : "Gravar"}
          </Button>
        </div>
      </Card>
      {/* Google Calendar Feed */}
      <GoogleCalendarSection />
    </div>
  );
}

/* ═══════════ Google Calendar Feed (inline) ═══════════ */

function getFeedUrl(token: string, systemUrl?: string) {
  const base = (systemUrl || window.location.origin).replace(/\/+$/, "");
  return `${base}/calendar/${token}.ics`;
}

function GoogleCalendarSection() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: clinicFeed, isLoading } = useQuery({
    queryKey: ["calendar-feed-clinic"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("calendar_feeds").select("*") as any)
        .eq("feed_type", "clinic")
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: feedSettings } = useQuery({
    queryKey: ["clinic-settings-feed-url"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_settings").select("system_url").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const systemUrl = (feedSettings as any)?.system_url || "";

  const generateFeed = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.from("calendar_feeds").insert({
        feed_type: "clinic",
        specialist_id: null,
      } as any);
      if (error) {
        if (error.code === "23505") {
          const newToken = crypto.randomUUID().replace(/-/g, "");
          const { error: updateError } = await (
            supabase.from("calendar_feeds").update({ token: newToken, is_active: true } as any) as any
          ).eq("feed_type", "clinic");
          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["calendar-feed-clinic"] });
      toast.success("Feed de calendário gerado!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const regenerateToken = async () => {
    const newToken = crypto.randomUUID().replace(/-/g, "");
    try {
      const { error } = await (supabase.from("calendar_feeds").update({ token: newToken } as any) as any).eq(
        "feed_type",
        "clinic",
      );
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["calendar-feed-clinic"] });
      toast.success("Token regenerado. O link antigo deixará de funcionar.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getFeedUrl(token, systemUrl));
    toast.success("Link copiado!");
  };

  const downloadIcs = (token: string) => {
    const a = document.createElement("a");
    a.href = getFeedUrl(token, systemUrl);
    a.download = "agenda.ics";
    a.click();
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-muted-foreground" />
        <Label className="text-sm font-semibold">Sincronização com Calendário Externo</Label>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Subscreva este link no Google Calendar, Apple Calendar ou Outlook para sincronizar a agenda.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
        <div className="space-y-1.5">
          <p className="font-semibold text-foreground">Google Calendar</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Abrir Google Calendar</li>
            <li>Clicar em "Adicionar calendário"</li>
            <li>Selecionar "Adicionar por URL"</li>
            <li>Colar o link de sincronização</li>
          </ol>
        </div>
        <div className="space-y-1.5">
          <p className="font-semibold text-foreground">Apple Calendar</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Abrir a app Calendário</li>
            <li>Ficheiro → Nova subscrição</li>
            <li>Colar o link</li>
          </ol>
        </div>
        <div className="space-y-1.5">
          <p className="font-semibold text-foreground">Outlook</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Abrir Outlook Calendar</li>
            <li>Adicionar calendário → Da Internet</li>
            <li>Colar o link</li>
          </ol>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : clinicFeed ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Feed ativo</span>
          </div>

            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs font-mono break-all text-foreground">{getFeedUrl(clinicFeed.token, systemUrl)}</p>
            </div>

          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={() => copyLink(clinicFeed.token)}>
              <Copy className="w-4 h-4" /> Copiar Link
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => downloadIcs(clinicFeed.token)}>
              <Download className="w-4 h-4" /> Baixar ICS
            </Button>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Regenerar o token irá invalidar o link atual.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5 text-destructive hover:text-destructive"
              onClick={regenerateToken}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerar Token
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-3 py-4">
          <p className="text-sm text-muted-foreground">Nenhum feed de calendário gerado.</p>
          <Button className="gap-1.5" disabled={generating} onClick={generateFeed}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
            Gerar Feed da Clínica
          </Button>
        </div>
      )}
    </Card>
  );
}

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getCalendarFeedUrl } from "@/lib/calendar-feed";
import { CalendarDays, Copy, Download, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const GoogleCalendarTab = () => {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings-url"],
    queryFn: async () => {
      const { data } = await supabase.from("clinic_settings").select("system_url").limit(1).maybeSingle();
      return data;
    },
  });

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

  const systemUrl = clinicSettings?.system_url || "";

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
    navigator.clipboard.writeText(getCalendarFeedUrl(token, systemUrl));
    toast.success("Link copiado!");
  };

  const downloadIcs = (token: string) => {
    const a = document.createElement("a");
    a.href = getCalendarFeedUrl(token, systemUrl);
    a.download = "agenda.ics";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-light tracking-wider flex items-center gap-2">
          <CalendarDays className="w-5 h-5" /> GOOGLE CALENDAR
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          A clínica possui um link único de calendário que pode ser assinado no Google Calendar, Apple Calendar ou Outlook.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold">Como Sincronizar</Label>
        </div>
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
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold">Feed da Clínica</Label>
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
              <p className="text-xs font-mono break-all text-foreground">{getCalendarFeedUrl(clinicFeed.token, systemUrl)}</p>
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
                <strong>Nota:</strong> Regenerar o token irá invalidar o link atual. Quem estiver a usar o link antigo
                deixará de receber atualizações.
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
    </div>
  );
};

export default GoogleCalendarTab;

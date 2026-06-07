import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Plus, X, Check, AlertTriangle, Clock, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon→Sun

async function fireBusinessHoursWebhook() {
  try {
    const { data: settings } = await supabase
      .from("integration_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["n8n_webhook_url_stuck_appointments"]);

    const url = settings?.find((s) => s.setting_key === "n8n_webhook_url_stuck_appointments")?.setting_value;
    if (!url) return;

    const { data: hours } = await supabase
      .from("business_hours")
      .select("weekday, start_time, end_time, active")
      .eq("active", true)
      .order("weekday")
      .order("start_time");

    const { data: clinic } = await supabase
      .from("clinic_settings")
      .select("clinic_name, timezone")
      .limit(1)
      .maybeSingle();

    const checkUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-stuck-appointments`;

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "business_hours_updated",
        clinic_name: clinic?.clinic_name || "Clínica",
        timezone: clinic?.timezone || "Europe/Lisbon",
        check_endpoint: checkUrl,
        business_hours: hours ?? [],
      }),
    }).catch((err) => console.error("[webhook] business hours dispatch failed:", err));
  } catch (err) {
    console.error("[webhook] error preparing business hours payload:", err);
  }
}

interface BusinessHour {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

type LocalRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
  isNew?: boolean;
  deleted?: boolean;
};

export default function BusinessHoursTab() {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<LocalRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .order("weekday")
        .order("start_time");
      if (error) throw error;
      setRows((data ?? []).map((d) => ({ ...d, isNew: false, deleted: false })));
      setDirty(false);
      return data as BusinessHour[];
    },
  });

  const { data: specialistCount } = useQuery({
    queryKey: ["specialist-hours-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialist_hours")
        .select("specialist_id")
        .limit(100);
      if (error) return 0;
      return new Set(data?.map((d) => d.specialist_id)).size;
    },
  });

  const activeRows = rows.filter((r) => !r.deleted);
  const isDayActive = (wd: number) => activeRows.some((r) => r.weekday === wd && r.active);

  const toggleDay = (wd: number) => {
    const active = isDayActive(wd);
    setRows((prev) =>
      prev.map((r) => (r.weekday === wd ? { ...r, active: !active } : r))
    );
    setDirty(true);
  };

  const dayRows = (wd: number) =>
    activeRows.filter((r) => r.weekday === wd && r.active).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const updateRow = (id: string, field: "start_time" | "end_time", value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    setDirty(true);
  };

  const addRow = (wd: number) => {
    const existing = dayRows(wd);
    const lastEnd = existing.length > 0 ? existing[existing.length - 1].end_time.slice(0, 5) : "09:00";
    const newStart = addMinutes(lastEnd, 15);
    const newEnd = addMinutes(newStart, 60);
    setRows((prev) => [
      ...prev,
      {
        id: `new-${crypto.randomUUID()}`,
        weekday: wd,
        start_time: newStart,
        end_time: newEnd,
        active: true,
        isNew: true,
        deleted: false,
      },
    ]);
    setDirty(true);
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
      const row = prev.find((r) => r.id === id);
      if (!row) return prev;
      if (row.isNew) return prev.filter((r) => r.id !== id);
      const siblings = prev.filter((r) => r.weekday === row.weekday && !r.deleted && r.id !== id);
      if (siblings.length === 0) {
        return prev.map((r) => (r.id === id ? { ...r, active: false } : r));
      }
      return prev.map((r) => (r.id === id ? { ...r, deleted: true } : r));
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toDelete = rows.filter((r) => r.deleted && !r.isNew);
      for (const r of toDelete) {
        await supabase.from("business_hours").delete().eq("id", r.id);
      }

      const toUpdate = rows.filter((r) => !r.deleted && !r.isNew);
      for (const r of toUpdate) {
        await supabase
          .from("business_hours")
          .update({ start_time: r.start_time, end_time: r.end_time, active: r.active })
          .eq("id", r.id);
      }

      const toInsert = rows.filter((r) => !r.deleted && r.isNew);
      if (toInsert.length > 0) {
        const { error } = await supabase.from("business_hours").insert(
          toInsert.map((r) => ({
            weekday: r.weekday,
            start_time: r.start_time,
            end_time: r.end_time,
            active: r.active,
          }))
        );
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      toast.success("Horários salvos com sucesso!");
      fireBusinessHoursWebhook();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <div className="mb-2">
        <h3 className="text-lg font-light tracking-wider flex items-center gap-2">
          <Clock className="w-5 h-5" /> HORÁRIOS
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Configure o horário de funcionamento da clínica.</p>
      </div>

      <Card className="p-5 space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Dias e Turnos</span>
        </div>

        {/* Day toggles */}
        <div className="flex items-center justify-center gap-6">
          {ORDERED_DAYS.map((wd) => {
            const active = isDayActive(wd);
            return (
              <button
                key={wd}
                type="button"
                onClick={() => toggleDay(wd)}
                className="flex flex-col items-center gap-1.5"
              >
                <span className={cn("text-sm font-medium transition-colors", active ? "text-primary" : "text-muted-foreground")}>
                  {WEEKDAY_SHORT[wd]}
                </span>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all border-2",
                  active ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-transparent"
                )}>
                  <Check className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Time rows */}
        <div className="bg-muted/20 border border-border rounded-lg divide-y divide-border">
          {ORDERED_DAYS.filter((wd) => isDayActive(wd)).length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum dia ativo. Clique nos dias acima para ativar.
            </div>
          ) : (
            ORDERED_DAYS.filter((wd) => isDayActive(wd)).map((wd) => {
              const wdRows = dayRows(wd);
              return (
                <div key={wd} className="px-6 py-5 space-y-3">
                  {wdRows.map((r, idx) => (
                    <div key={r.id} className="flex items-center gap-4">
                      <span className="w-12 text-sm font-medium text-primary shrink-0">
                        {idx === 0 ? WEEKDAY_SHORT[wd] : ""}
                      </span>
                      <div className="flex items-center gap-3 flex-1">
                        <Select value={r.start_time.slice(0, 5)} onValueChange={(v) => updateRow(r.id, "start_time", v)}>
                          <SelectTrigger className="flex-1 min-w-0"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-60">
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={`s-${t}`} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={r.end_time.slice(0, 5)} onValueChange={(v) => updateRow(r.id, "end_time", v)}>
                          <SelectTrigger className="flex-1 min-w-0"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-60">
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={`e-${t}`} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {wdRows.length > 1 ? (
                        <button type="button" onClick={() => removeRow(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      ) : (
                        <button type="button" onClick={() => addRow(wd)} className="text-primary hover:text-primary/80 transition-colors">
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {wdRows.length > 1 && (
                    <div className="flex items-center gap-4">
                      <span className="w-12 shrink-0" />
                      <div className="flex-1" />
                      <button type="button" onClick={() => addRow(wd)} className="text-primary hover:text-primary/80 transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Specialist warning */}
        {(specialistCount ?? 0) > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-orange-300/50 bg-orange-50 dark:bg-orange-950/20 p-4 text-sm text-orange-700 dark:text-orange-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Aviso: tem {specialistCount} colaborador{(specialistCount ?? 0) > 1 ? "es" : ""} com horário diferente deste horário da loja. As alterações que fizer nesta página não terão efeito nesse{(specialistCount ?? 0) > 1 ? "s" : ""} colaborador{(specialistCount ?? 0) > 1 ? "es" : ""}.
            </p>
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "A gravar..." : "Gravar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

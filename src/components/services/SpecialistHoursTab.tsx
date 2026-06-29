import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const WEEKDAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Props {
  specialistId: string;
}

const SpecialistHoursTab = ({ specialistId }: Props) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: hours, isLoading } = useQuery({
    queryKey: ["specialist-hours", specialistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialist_hours")
        .select("*")
        .eq("specialist_id", specialistId)
        .order("weekday")
        .order("start_time");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!specialistId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["specialist-hours", specialistId] });

  // Dia está explicitamente desativado quando existe registro com active=false
  const isDayDisabled = (weekday: number) =>
    !!hours?.some((h: any) => h.weekday === weekday && h.active === false);

  // Horários ativos do dia
  const dayHours = (weekday: number) =>
    hours?.filter((h: any) => h.weekday === weekday && h.active !== false) ?? [];

  const toggleDay = async (weekday: number, currentlyDisabled: boolean) => {
    setSaving(true);
    try {
      if (currentlyDisabled) {
        // Reativar: remover marcador inactive e adicionar horário padrão se vazio
        await supabase
          .from("specialist_hours")
          .delete()
          .eq("specialist_id", specialistId)
          .eq("weekday", weekday)
          .eq("active", false as any);
        const hasActive = hours?.some((h: any) => h.weekday === weekday && h.active !== false);
        if (!hasActive) {
          await supabase.from("specialist_hours").insert({
            specialist_id: specialistId,
            weekday,
            start_time: "09:00",
            end_time: "18:00",
            active: true,
          } as any);
        }
      } else {
        // Desativar: apagar todos os registros do dia e inserir marcador inactive
        await supabase
          .from("specialist_hours")
          .delete()
          .eq("specialist_id", specialistId)
          .eq("weekday", weekday);
        await supabase.from("specialist_hours").insert({
          specialist_id: specialistId,
          weekday,
          start_time: "00:00",
          end_time: "00:00",
          active: false,
        } as any);
      }
      invalidate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addHour = async (weekday: number) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("specialist_hours").insert({
        specialist_id: specialistId,
        weekday,
        start_time: "09:00",
        end_time: "18:00",
        active: true,
      } as any);
      if (error) throw error;
      invalidate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateHour = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("specialist_hours").update({ [field]: value } as any).eq("id", id);
    if (error) toast.error(error.message);
    else invalidate();
  };

  const deleteHour = async (id: string) => {
    const { error } = await supabase.from("specialist_hours").delete().eq("id", id);
    if (error) toast.error(error.message);
    else invalidate();
  };

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Defina os dias e horários deste especialista. Dias desativados não aparecem no agendamento online.
        Se um dia estiver ativo sem horário definido, usa o horário da clínica.
      </p>

      {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
        const disabled = isDayDisabled(weekday);
        const activeHours = dayHours(weekday);

        return (
          <div
            key={weekday}
            className={`p-3 rounded-lg border transition-colors ${disabled ? "border-border/30 bg-muted/10 opacity-60" : "border-border bg-card"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Switch
                  checked={!disabled}
                  disabled={saving}
                  onCheckedChange={() => toggleDay(weekday, disabled)}
                />
                <span className={`text-sm font-medium ${disabled ? "text-muted-foreground" : ""}`}>
                  {WEEKDAY_NAMES[weekday]}
                </span>
                {disabled && (
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wide">Indisponível</span>
                )}
              </div>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addHour(weekday)}
                  disabled={saving}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Intervalo
                </Button>
              )}
            </div>

            {!disabled && (
              activeHours.length > 0 ? (
                <div className="space-y-2">
                  {activeHours.map((h: any) => (
                    <div key={h.id} className="flex items-center gap-2">
                      <Input
                        type="time"
                        defaultValue={h.start_time?.slice(0, 5)}
                        onBlur={(e) => updateHour(h.id, "start_time", e.target.value)}
                        className="w-28 h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">→</span>
                      <Input
                        type="time"
                        defaultValue={h.end_time?.slice(0, 5)}
                        onBlur={(e) => updateHour(h.id, "end_time", e.target.value)}
                        className="w-28 h-8 text-xs"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteHour(h.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  Sem horário definido — usa o horário da clínica
                </p>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SpecialistHoursTab;

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_FULL  = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const ORDERED_DAYS  = [1, 2, 3, 4, 5, 6, 0];

interface BusinessHour {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

const BusinessHours = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<Record<string, Partial<BusinessHour>>>({});
  const [adding, setAdding] = useState(false);

  const { data: hours = [], isLoading } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .order("weekday")
        .order("start_time");
      if (error) throw error;
      return data as BusinessHour[];
    },
  });

  const getMerged = (h: BusinessHour): BusinessHour => ({ ...h, ...edits[h.id] });

  const updateField = (id: string, field: keyof BusinessHour, value: any) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  // Group by weekday
  const byDay = (wd: number) => hours.filter((h) => h.weekday === wd).map(getMerged);

  // Is day active? (any slot active, or first slot active)
  const isDayActive = (wd: number) => {
    const slots = byDay(wd);
    return slots.length > 0 && slots[0].active;
  };

  const toggleDay = async (wd: number) => {
    const slots = hours.filter((h) => h.weekday === wd);
    const currently = slots.length > 0 && (edits[slots[0].id]?.active ?? slots[0].active);
    if (slots.length === 0) {
      // Create a default slot
      const { error } = await supabase
        .from("business_hours")
        .insert({ weekday: wd, start_time: "09:00", end_time: "18:00", active: true } as any);
      if (error) { toast.error("Erro ao ativar dia."); return; }
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
    } else {
      slots.forEach((s) => updateField(s.id, "active", !currently));
    }
  };

  const addSlot = async (wd: number) => {
    setAdding(true);
    try {
      const { error } = await supabase
        .from("business_hours")
        .insert({ weekday: wd, start_time: "09:00", end_time: "18:00", active: true } as any);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  const removeSlot = async (id: string) => {
    const { error } = await supabase.from("business_hours").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover intervalo."); return; }
    setEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
    queryClient.invalidateQueries({ queryKey: ["business-hours"] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [id, changes] of Object.entries(edits)) {
        const { error } = await supabase.from("business_hours").update(changes as any).eq("id", id);
        if (error) throw error;
      }
      setEdits({});
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      toast.success("Horários salvos com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(edits).length > 0;

  return (
    <div>
      <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/admin")}>
        <ChevronLeft className="w-4 h-4" /> Configurações
      </Button>

      <BlurFade delay={0.05}>
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wider">Horários de Funcionamento</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure o horário de funcionamento da clínica.</p>
        </div>
      </BlurFade>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <BlurFade delay={0.1}>
          <div className="space-y-6">
            {/* Day toggles */}
            <div className="flex items-center justify-center gap-5">
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

            {/* Day rows */}
            <div className="space-y-3">
              {ORDERED_DAYS.map((wd) => {
                const slots = byDay(wd);
                if (slots.length === 0 || !slots[0].active) return null;
                return (
                  <div key={wd} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-muted/20">
                      <span className="text-sm font-medium text-primary">{WEEKDAY_FULL[wd]}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                        disabled={adding}
                        onClick={() => addSlot(wd)}
                      >
                        <Plus className="w-3.5 h-3.5" /> Intervalo
                      </Button>
                    </div>
                    <div className="divide-y divide-border/50">
                      {slots.map((h, idx) => (
                        <div key={h.id} className="flex items-center gap-4 px-5 py-3">
                          <span className="text-xs text-muted-foreground w-16 shrink-0">
                            {idx === 0 ? "Abertura" : `Intervalo ${idx}`}
                          </span>
                          <Input
                            type="time"
                            value={h.start_time?.slice(0, 5) ?? ""}
                            onChange={(e) => updateField(h.id, "start_time", e.target.value)}
                            className="w-32"
                          />
                          <span className="text-muted-foreground text-xs">até</span>
                          <Input
                            type="time"
                            value={h.end_time?.slice(0, 5) ?? ""}
                            onChange={(e) => updateField(h.id, "end_time", e.target.value)}
                            className="w-32"
                          />
                          {slots.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 ml-auto text-muted-foreground hover:text-destructive"
                              onClick={() => removeSlot(h.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {ORDERED_DAYS.every((wd) => !isDayActive(wd)) && (
                <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                  Nenhum dia ativo. Clique nos dias acima para ativar.
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving || !hasChanges}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </BlurFade>
      )}
    </div>
  );
};

export default BusinessHours;

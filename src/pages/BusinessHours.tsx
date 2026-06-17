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
const WEEKDAY_ABBR = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface BusinessHour {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

const BusinessHours = () => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<Record<string, Partial<BusinessHour>>>({});

  const { data: hours, isLoading } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_hours").select("*").order("weekday");
      if (error) throw error;
      return data as BusinessHour[];
    },
  });

  const updateField = (id: string, field: keyof BusinessHour, value: any) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const getMerged = (h: BusinessHour) => ({ ...h, ...edits[h.id] });

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

  // Reorder: Mon(1) Tue(2) Wed(3) Thu(4) Fri(5) Sat(6) Sun(0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  const activeDays = hours
    ? orderedDays
        .map((wd) => hours.find((h) => h.weekday === wd))
        .filter(Boolean)
        .map((h) => getMerged(h!))
        .filter((h) => h.active)
    : [];

  const navigate = useNavigate();

  return (
    <div>
      <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/admin")}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Configurações
      </Button>
      <BlurFade delay={0.05}>
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wider">Horários de Funcionamento</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure o horário de funcionamento.</p>
        </div>
      </BlurFade>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <BlurFade delay={0.1}>
          <div className="space-y-8">
            {/* Day toggles row */}
            <div className="flex items-center justify-center gap-6">
              {orderedDays.map((wd) => {
                const h = hours?.find((hr) => hr.weekday === wd);
                if (!h) return null;
                const merged = getMerged(h);
                const isActive = merged.active;

                return (
                  <button
                    key={wd}
                    type="button"
                    onClick={() => updateField(h.id, "active", !isActive)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {WEEKDAY_SHORT[wd]}
                    </span>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center transition-all border-2",
                        isActive
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30 text-transparent"
                      )}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time rows for active days */}
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              {activeDays.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum dia ativo. Clique nos dias acima para ativar.
                </div>
              ) : (
                activeDays.map((h) => (
                  <div key={h.id} className="flex items-center gap-4 px-6 py-5">
                    <span className="w-12 text-sm font-medium text-primary shrink-0">
                      {WEEKDAY_ABBR[h.weekday]}
                    </span>
                    <div className="flex items-center gap-3 flex-1">
                      <Input
                        type="time"
                        value={h.start_time?.slice(0, 5)}
                        onChange={(e) => updateField(h.id, "start_time", e.target.value)}
                        className="w-32"
                      />
                      <Input
                        type="time"
                        value={h.end_time?.slice(0, 5)}
                        onChange={(e) => updateField(h.id, "end_time", e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving || Object.keys(edits).length === 0}>
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

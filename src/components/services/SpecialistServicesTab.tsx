import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Clock } from "lucide-react";

interface Props {
  specialistId: string;
}

const formatDuration = (mins: number | null) => {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, "0")}`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
};

const SpecialistServicesTab = ({ specialistId }: Props) => {
  const queryClient = useQueryClient();

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["all-services-for-specialist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, duration_minutes, display_order")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: assigned, isLoading: loadingAssigned } = useQuery({
    queryKey: ["specialist-services", specialistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialist_services")
        .select("*")
        .eq("specialist_id", specialistId);
      if (error) throw error;
      return data;
    },
    enabled: !!specialistId,
  });

  const toggleService = useMutation({
    mutationFn: async ({ serviceId, enabled }: { serviceId: string; enabled: boolean }) => {
      if (enabled) {
        const { error } = await supabase.from("specialist_services").insert({
          specialist_id: specialistId,
          service_id: serviceId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("specialist_services")
          .delete()
          .eq("specialist_id", specialistId)
          .eq("service_id", serviceId);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["specialist-services", specialistId] }),
    onError: () => toast.error("Erro ao atualizar serviço."),
  });

  const updateDuration = useMutation({
    mutationFn: async ({ serviceId, duration }: { serviceId: string; duration: number | null }) => {
      const { error } = await supabase
        .from("specialist_services")
        .update({ custom_duration_minutes: duration })
        .eq("specialist_id", specialistId)
        .eq("service_id", serviceId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["specialist-services", specialistId] }),
    onError: () => toast.error("Erro ao atualizar duração."),
  });

  const isLoading = loadingServices || loadingAssigned;

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const assignedMap = new Map((assigned ?? []).map(a => [a.service_id, a]));

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-4">
        Selecione os serviços que este especialista executa e defina durações personalizadas se necessário.
      </p>
      {services?.map((svc) => {
        const assignment = assignedMap.get(svc.id);
        const isEnabled = !!assignment;
        return (
          <div key={svc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
            <Switch
              checked={isEnabled}
              onCheckedChange={(v) => toggleService.mutate({ serviceId: svc.id, enabled: v })}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{svc.name}</p>
            </div>
            {isEnabled && (
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min={5}
                    step={5}
                    className="w-24 h-8 text-sm"
                    placeholder={svc.duration_minutes ? `${svc.duration_minutes}` : "—"}
                    defaultValue={assignment?.custom_duration_minutes ?? ""}
                    onBlur={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      updateDuration.mutate({ serviceId: svc.id, duration: val });
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground pr-0.5">(minutos)</span>
              </div>
            )}
          </div>
        );
      })}
      {(!services || services.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum serviço ativo cadastrado.</p>
      )}
    </div>
  );
};

export default SpecialistServicesTab;

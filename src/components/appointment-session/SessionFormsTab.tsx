import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2 } from "lucide-react";
import { AnamnesisFaceForm } from "@/components/clients/AnamnesisFaceForm";
import { AnamnesisBodyForm } from "@/components/clients/AnamnesisBodyForm";
import { FichaCorporal } from "@/components/clients/FichaCorporal";
import { FichaFacial } from "@/components/clients/FichaFacial";
import { FichaEpilacao } from "@/components/clients/FichaEpilacao";
import { FichaInjetaveis } from "@/components/clients/FichaInjetaveis";
import { toast } from "sonner";

// Fields that belong to sections 8-9 (Face form) — NOT pre-filled, shown as placeholder
const FACE_PLAN_FIELDS = [
  "observacoes_clinicas",
  "plano_objetivo",
  "plano_protocolo",
  "plano_sessoes",
  "plano_intervalo",
  "plano_homecare",
];

// Equivalent fields for Body form — NOT pre-filled, shown as placeholder
const BODY_PLAN_FIELDS = [
  "plano_frequencia",
  "plano_tecnicas",
  "plano_sessoes",
  "plano_reavaliacao",
  "orientacoes",
  "observacoes",
];

interface Props {
  appointmentId: string;
  clientId: string;
  serviceId: string | null;
}

export default function SessionFormsTab({ appointmentId, clientId, serviceId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get the service to determine form type
  const { data: service } = useQuery({
    queryKey: ["service-detail", serviceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("requires_assessment_form, assessment_form_type")
        .eq("id", serviceId!)
        .single();
      return data;
    },
    enabled: !!serviceId,
  });

  const rawFormType = (service as any)?.assessment_form_type ?? "rosto";
  const requiresForm = service?.requires_assessment_form ?? false;

  if (!requiresForm) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Este serviço não requer ficha de anamnese.</p>
      </div>
    );
  }

  // If "ambos", render sub-tabs
  if (rawFormType === "ambos") {
    return (
      <Tabs defaultValue="rosto" className="space-y-4">
        <TabsList className="h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="rosto" className="text-xs">Ficha de Rosto</TabsTrigger>
          <TabsTrigger value="corpo" className="text-xs">Ficha de Corpo</TabsTrigger>
        </TabsList>
        <TabsContent value="rosto">
          <SingleFormTab appointmentId={appointmentId} clientId={clientId} formType="rosto" />
        </TabsContent>
        <TabsContent value="corpo">
          <SingleFormTab appointmentId={appointmentId} clientId={clientId} formType="corpo" />
        </TabsContent>
      </Tabs>
    );
  }

  return <SingleFormTab appointmentId={appointmentId} clientId={clientId} formType={rawFormType} />;
}

function SingleFormTab({ appointmentId, clientId, formType }: { appointmentId: string; clientId: string; formType: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const planFields =
    formType === "corpo" ? BODY_PLAN_FIELDS
    : formType === "rosto" ? FACE_PLAN_FIELDS
    : [];

  // Check if this appointment already has a form saved for this type
  const { data: existingForm } = useQuery({
    queryKey: ["appointment-anamnesis", appointmentId, formType],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointment_anamnesis")
        .select("*")
        .eq("appointment_id", appointmentId)
        .eq("form_type", formType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Get the LAST form for this client (same type) to pre-fill
  const { data: lastForm, isLoading: loadingLast } = useQuery({
    queryKey: ["last-anamnesis", clientId, formType],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointment_anamnesis")
        .select("form_data")
        .eq("client_id", clientId)
        .eq("form_type", formType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!clientId && !!formType,
  });

  const defaultValues = (() => {
    if (existingForm) return (existingForm.form_data as Record<string, any>) ?? {};
    if (!lastForm?.form_data) return {};
    const last = lastForm.form_data as Record<string, any>;
    const defaults: Record<string, any> = {};
    for (const [k, v] of Object.entries(last)) {
      if (!planFields.includes(k)) defaults[k] = v;
    }
    return defaults;
  })();

  const placeholderData = (() => {
    if (existingForm) return {};
    if (!lastForm?.form_data) return {};
    const last = lastForm.form_data as Record<string, any>;
    const placeholders: Record<string, any> = {};
    for (const field of planFields) {
      if (last[field] && typeof last[field] === "string" && last[field].trim()) {
        placeholders[field] = last[field];
      }
    }
    return placeholders;
  })();

  const handleFormChange = useCallback((data: Record<string, any>) => {
    setFormData(data);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        appointment_id: appointmentId,
        client_id: clientId,
        form_type: formType,
        form_data: formData,
        filled_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error } = existingForm
        ? await supabase.from("appointment_anamnesis").update({
            form_data: formData,
            filled_by: user?.id ?? null,
            updated_at: new Date().toISOString(),
          }).eq("id", existingForm.id)
        : await supabase.from("appointment_anamnesis").insert(payload);
      if (error) throw error;
      toast.success("Ficha de anamnese salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["appointment-anamnesis", appointmentId, formType] });
      queryClient.invalidateQueries({ queryKey: ["last-anamnesis", clientId, formType] });
    } catch (err: any) {
      toast.error("Erro ao salvar ficha: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  if (loadingLast) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          {{
            corpo: "Anamnese — Corpo",
            rosto: "Anamnese — Rosto",
            corporal: "Ficha Corporal",
            facial: "Ficha Facial",
            epilacao: "Ficha de Epilação",
            injetaveis: "Ficha de Injetáveis",
          }[formType] ?? "Ficha"}
        </h3>
        <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar Ficha
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        {formType === "corpo" ? (
          <AnamnesisBodyForm
            defaultValues={defaultValues}
            placeholderData={placeholderData}
            onChange={handleFormChange}
          />
        ) : formType === "rosto" ? (
          <AnamnesisFaceForm
            defaultValues={defaultValues}
            placeholderData={placeholderData}
            onChange={handleFormChange}
          />
        ) : formType === "corporal" ? (
          <FichaCorporal defaultValues={defaultValues} onChange={handleFormChange} />
        ) : formType === "facial" ? (
          <FichaFacial defaultValues={defaultValues} onChange={handleFormChange} />
        ) : formType === "epilacao" ? (
          <FichaEpilacao defaultValues={defaultValues} onChange={handleFormChange} />
        ) : formType === "injetaveis" ? (
          <FichaInjetaveis defaultValues={defaultValues} onChange={handleFormChange} />
        ) : (
          <AnamnesisFaceForm
            defaultValues={defaultValues}
            placeholderData={placeholderData}
            onChange={handleFormChange}
          />
        )}
      </div>
    </div>
  );
}

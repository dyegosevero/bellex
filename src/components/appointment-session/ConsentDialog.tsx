import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SignatureCanvas from "react-signature-canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eraser, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// Fallback texts in case DB is empty
const FALLBACK_TEXTS: Record<string, string> = {
  treatment_social: "Termo de consentimento para uso público (configure em Configurações > Documentos)",
  treatment_internal: "Termo de consentimento para uso interno (configure em Configurações > Documentos)",
  treatment_only: "Termo de consentimento apenas para realização do serviço (configure em Configurações > Documentos)",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  appointmentId: string;
  onConsentSaved: () => void;
}

export default function ConsentDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  appointmentId,
  onConsentSaved,
}: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sigCanvasClient = useRef<SignatureCanvas>(null);
  const sigCanvasPro = useRef<SignatureCanvas>(null);
  const consentType = "treatment_only" as const;
  const [saving, setSaving] = useState(false);

  // Citizen card capture state
  const [showCitizenCardDialog, setShowCitizenCardDialog] = useState(false);
  const [citizenCardInput, setCitizenCardInput] = useState("");
  const [savingCard, setSavingCard] = useState(false);
  const [citizenCardReady, setCitizenCardReady] = useState(false);

  // Fetch consent texts from database
  const { data: consentTextsData } = useQuery({
    queryKey: ["consent-texts-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_texts")
        .select("slug, content");
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((row: any) => { map[row.slug] = row.content; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch client data (citizen card)
  const { data: clientData, refetch: refetchClient } = useQuery({
    queryKey: ["client-citizen-card", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("citizen_card_number")
        .eq("id", clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Fetch appointment details (service + specialist)
  const { data: appointmentInfo } = useQuery({
    queryKey: ["consent-appointment-info", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("service_id, specialist_id")
        .eq("id", appointmentId)
        .single();
      if (error) throw error;

      let serviceName = "";
      let specialistName = "";

      if (data.service_id) {
        const { data: svc } = await supabase.from("services").select("name").eq("id", data.service_id).single();
        serviceName = svc?.name || "";
      }
      if (data.specialist_id) {
        const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", data.specialist_id).single();
        specialistName = prof?.full_name || "";
      }

      return { serviceName, specialistName };
    },
    enabled: !!appointmentId,
    staleTime: 5 * 60 * 1000,
  });

  // When dialog opens, check if citizen card is available
  useEffect(() => {
    if (open) {
      setCitizenCardReady(false);
      if (clientData?.citizen_card_number) {
        setCitizenCardReady(true);
      } else {
        setShowCitizenCardDialog(true);
        setCitizenCardInput("");
      }
    }
  }, [open, clientData]);

  const consentTexts = consentTextsData || FALLBACK_TEXTS;

  // Replace variables in template
  const resolveTemplate = (template: string) => {
    const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: pt });
    return template
      .replace(/\{nome\}/gi, clientName)
      .replace(/\{nome_completo\}/gi, clientName)
      .replace(/\{cpf_rg\}/gi, clientData?.citizen_card_number || "")
      .replace(/\{data\}/gi, today)
      .replace(/\{servico\}/gi, appointmentInfo?.serviceName || "")
      .replace(/\{especialista\}/gi, appointmentInfo?.specialistName || "");
  };

  const handleSaveCitizenCard = async () => {
    if (!citizenCardInput.trim()) {
      toast.error("Por favor, informe o número do RG / CPF.");
      return;
    }
    setSavingCard(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ citizen_card_number: citizenCardInput.trim() })
        .eq("id", clientId);
      if (error) throw error;
      await refetchClient();
      queryClient.invalidateQueries({ queryKey: ["client-detail"] });
      setShowCitizenCardDialog(false);
      setCitizenCardReady(true);
      toast.success("RG / CPF atualizado.");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setSavingCard(false);
    }
  };

  const handleClearClient = () => sigCanvasClient.current?.clear();
  const handleClearPro = () => sigCanvasPro.current?.clear();

  const handleConfirm = async () => {
    if (!sigCanvasClient.current || sigCanvasClient.current.isEmpty()) {
      toast.error("Por favor, recolha a assinatura do cliente.");
      return;
    }
    if (!sigCanvasPro.current || sigCanvasPro.current.isEmpty()) {
      toast.error("Por favor, assine como profissional.");
      return;
    }

    setSaving(true);
    try {
      // Upload client signature
      const clientDataUrl = sigCanvasClient.current.toDataURL("image/png");
      const clientRes = await fetch(clientDataUrl);
      const clientBlob = await clientRes.blob();
      const ts = Date.now();
      const clientFileName = `${clientId}/${appointmentId}_client_${ts}.png`;
      const { error: uploadErr1 } = await storage
        .from("consent-signatures")
        .upload(clientFileName, clientBlob, { contentType: "image/png", upsert: true });
      if (uploadErr1) throw uploadErr1;

      // Upload professional signature
      const proDataUrl = sigCanvasPro.current.toDataURL("image/png");
      const proRes = await fetch(proDataUrl);
      const proBlob = await proRes.blob();
      const proFileName = `${clientId}/${appointmentId}_pro_${ts}.png`;
      const { error: uploadErr2 } = await storage
        .from("consent-signatures")
        .upload(proFileName, proBlob, { contentType: "image/png", upsert: true });
      if (uploadErr2) throw uploadErr2;

      // Save consent record with storage path (not public URL)
      const { error: insertErr } = await supabase.from("client_consents").insert({
        client_id: clientId,
        appointment_id: appointmentId,
        consent_type: consentType,
        signature_url: clientFileName,
        signed_by_name: clientName,
        signed_at: new Date().toISOString(),
        collected_by: user?.id,
        is_valid: true,
      });
      if (insertErr) throw insertErr;

      toast.success("Consentimento cadastrado com sucesso.");
      onConsentSaved();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Consent save error:", err);
      toast.error(`Erro ao gravar consentimento: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: pt });
  const renderedText = citizenCardReady
    ? resolveTemplate(consentTexts[consentType] || FALLBACK_TEXTS[consentType])
    : "";

  return (
    <>
      {/* Citizen Card Capture Dialog */}
      <Dialog open={showCitizenCardDialog && open} onOpenChange={(v) => {
        if (!v) {
          setShowCitizenCardDialog(false);
          if (!clientData?.citizen_card_number) {
            onOpenChange(false);
          }
        }
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>RG / CPF Necessário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            O cliente <strong>{clientName}</strong> não possui o número do RG / CPF cadastrado.
            Este dado é necessário para o termo de consentimento.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Nº RG / CPF *
            </Label>
            <Input
              value={citizenCardInput}
              onChange={(e) => setCitizenCardInput(e.target.value)}
              placeholder="Ex: 12345678"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCitizenCardDialog(false); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCitizenCard} disabled={savingCard}>
              {savingCard && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Salvar e Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Consent Dialog */}
      <Dialog open={open && citizenCardReady && !showCitizenCardDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termo de Responsabilidade e Autorização</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Consent document */}
            <div className="bg-muted/30 border border-border rounded-lg p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Documento</p>
              <p className="text-sm whitespace-pre-line leading-relaxed">{renderedText}</p>
            </div>

            {/* Date */}
            <div className="bg-muted/30 border border-border rounded-lg px-5 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Data</p>
              <p className="text-sm font-medium">{today}</p>
            </div>

            {/* Client signature */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Assinatura do(a) Cliente
                </p>
                <Button variant="ghost" size="sm" onClick={handleClearClient} className="h-7 px-2 text-xs text-muted-foreground">
                  <Eraser className="w-3 h-3 mr-1" /> Limpar
                </Button>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg bg-background overflow-hidden">
                <SignatureCanvas
                  ref={sigCanvasClient}
                  canvasProps={{
                    className: "w-full",
                    style: { width: "100%", height: 140 },
                  }}
                  penColor="hsl(30, 12%, 25%)"
                />
              </div>
            </div>

            {/* Professional signature */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Assinatura da Profissional
                </p>
                <Button variant="ghost" size="sm" onClick={handleClearPro} className="h-7 px-2 text-xs text-muted-foreground">
                  <Eraser className="w-3 h-3 mr-1" /> Limpar
                </Button>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg bg-background overflow-hidden">
                <SignatureCanvas
                  ref={sigCanvasPro}
                  canvasProps={{
                    className: "w-full",
                    style: { width: "100%", height: 140 },
                  }}
                  penColor="hsl(30, 12%, 25%)"
                />
              </div>
            </div>

            {/* Confirm button */}
            <div className="flex justify-end pt-2">
              <Button onClick={handleConfirm} disabled={saving} className="gap-1.5">
                <Check className="w-4 h-4" /> {saving ? "Salvando..." : "Confirmar e Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

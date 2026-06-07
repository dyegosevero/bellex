import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eraser, Check, Loader2, Clock, User, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { fmtDateLong, fmtTime } from "@/lib/date";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  specialistName: string;
  startTime: string;
  endTime: string | null;
  required: boolean;
  onSigned: () => void;
}

export default function CompletionSignatureDialog({
  open,
  onOpenChange,
  appointmentId,
  clientId,
  clientName,
  serviceName,
  specialistName,
  startTime,
  endTime,
  required,
  onSigned,
}: Props) {
  const { user } = useAuth();
  const sigRef = useRef<SignatureCanvas>(null);
  const [saving, setSaving] = useState(false);

  const handleClear = () => sigRef.current?.clear();

  const handleSkip = () => {
    if (required) {
      toast.error("A assinatura de realização é obrigatória para este serviço.");
      return;
    }
    onSigned();
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Por favor, recolha a assinatura do cliente.");
      return;
    }

    setSaving(true);
    try {
      // Upload signature
      const dataUrl = sigRef.current.toDataURL("image/png");
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const ts = Date.now();
      const fileName = `${clientId}/${appointmentId}_completion_${ts}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("consent-signatures")
        .upload(fileName, blob, { contentType: "image/png", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("consent-signatures").getPublicUrl(fileName);

      // Save as client_document
      const docName = `Assinatura de Realização - ${format(new Date(startTime), "dd/MM/yyyy", { locale: pt })} - ${serviceName}`;
      const { error: docErr } = await supabase.from("client_documents").insert({
        client_id: clientId,
        file_url: fileName,
        file_name: docName,
        document_type: "completion_signature",
        appointment_id: appointmentId,
        notes: `Serviço: ${serviceName} | Especialista: ${specialistName} | ${fmtTime(startTime)}${endTime ? ` – ${fmtTime(endTime)}` : ""}`,
        uploaded_by: user?.id,
      } as any);
      if (docErr) throw docErr;

      toast.success("Assinatura de realização registada com sucesso.");
      onSigned();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Completion signature error:", err);
      toast.error(`Erro ao gravar assinatura: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: pt });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !required) onOpenChange(false); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assinatura de Realização</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info text */}
          <p className="text-sm text-muted-foreground">
            Confirmo que estive presente e realizei o procedimento descrito abaixo.
          </p>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailCard icon={<CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />} label="Data" value={fmtDateLong(startTime)} />
            <DetailCard icon={<Clock className="w-3.5 h-3.5 text-muted-foreground" />} label="Horário" value={`${fmtTime(startTime)}${endTime ? ` – ${fmtTime(endTime)}` : ""}`} />
            <DetailCard icon={<Sparkles className="w-3.5 h-3.5 text-muted-foreground" />} label="Serviço" value={serviceName} />
            <DetailCard icon={<User className="w-3.5 h-3.5 text-muted-foreground" />} label="Especialista" value={specialistName} />
          </div>

          {/* Client name */}
          <div className="bg-muted/30 border border-border rounded-lg px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Cliente</p>
            <p className="text-sm font-medium">{clientName}</p>
          </div>

          {/* Signature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Assinatura do(a) Cliente
              </p>
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 px-2 text-xs text-muted-foreground">
                <Eraser className="w-3 h-3 mr-1" /> Limpar
              </Button>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg bg-background overflow-hidden">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  className: "w-full",
                  style: { width: "100%", height: 140 },
                }}
                penColor="hsl(30, 12%, 25%)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2">
            {!required ? (
              <Button variant="outline" onClick={handleSkip}>
                Saltar
              </Button>
            ) : (
              <p className="text-xs text-destructive self-center">* Assinatura obrigatória</p>
            )}
            <Button onClick={handleConfirm} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "A gravar..." : "Confirmar e Finalizar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-muted/30 border border-border rounded-lg px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}

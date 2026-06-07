import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_TEXTS: Record<string, string> = {
  treatment_social: "Documento não encontrado.",
  treatment_internal: "Documento não encontrado.",
};

interface ConsentRecord {
  id: string;
  consent_type: string;
  signature_url: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
  created_at: string;
  client_id?: string;
  appointment_id?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consent: ConsentRecord;
}

export default function ConsentViewDialog({ open, onOpenChange, consent }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch consent texts from DB
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

  // Fetch client data for variable substitution
  const { data: clientData } = useQuery({
    queryKey: ["consent-view-client", consent.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("full_name, citizen_card_number")
        .eq("id", consent.client_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!consent.client_id,
  });

  // Fetch appointment info (service + specialist) for variable substitution
  const { data: appointmentInfo } = useQuery({
    queryKey: ["consent-view-appointment", consent.appointment_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("service_id, specialist_id")
        .eq("id", consent.appointment_id!)
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
    enabled: !!consent.appointment_id,
  });

  const resolveTemplate = (template: string) => {
    const signedDate = consent.signed_at || consent.created_at;
    const dateStr = format(new Date(signedDate), "d 'de' MMMM 'de' yyyy", { locale: pt });
    return template
      .replace(/\{nome\}/gi, clientData?.full_name || consent.signed_by_name || "")
      .replace(/\{nome_completo\}/gi, clientData?.full_name || consent.signed_by_name || "")
      .replace(/\{cartao_cidadao\}/gi, clientData?.citizen_card_number || "")
      .replace(/\{data\}/gi, dateStr)
      .replace(/\{servico\}/gi, appointmentInfo?.serviceName || "")
      .replace(/\{especialista\}/gi, appointmentInfo?.specialistName || "");
  };

  const consentTexts = consentTextsData || FALLBACK_TEXTS;
  const rawText = consentTexts[consent.consent_type] ?? "Documento não encontrado.";
  const consentText = resolveTemplate(rawText);

  const signedDate = consent.signed_at
    ? format(new Date(consent.signed_at), "d 'de' MMMM 'de' yyyy", { locale: pt })
    : format(new Date(consent.created_at), "d 'de' MMMM 'de' yyyy", { locale: pt });

  // Generate signed URLs for private bucket
  const [clientSigUrl, setClientSigUrl] = useState<string | null>(null);
  const [proSigUrl, setProSigUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadSignedUrls = async () => {
      if (!consent.signature_url) {
        setClientSigUrl(null);
        setProSigUrl(null);
        return;
      }

      // Extract storage path from full URL or use as-is if already a path
      const extractPath = (url: string) => {
        const marker = "/consent-signatures/";
        const idx = url.indexOf(marker);
        return idx !== -1 ? decodeURIComponent(url.substring(idx + marker.length)) : url;
      };

      const clientPath = extractPath(consent.signature_url);
      const { data: clientData } = await supabase.storage
        .from("consent-signatures")
        .createSignedUrl(clientPath, 3600);
      setClientSigUrl(clientData?.signedUrl ?? null);

      const proPath = clientPath.replace("_client_", "_pro_");
      const { data: proData } = await supabase.storage
        .from("consent-signatures")
        .createSignedUrl(proPath, 3600);
      setProSigUrl(proData?.signedUrl ?? null);
    };
    if (open) loadSignedUrls();
  }, [consent.signature_url, open]);

  const consentTypeLabel = consent.consent_type === "treatment_social"
    ? "Tratamento + Autorização de Imagem (Redes Sociais)"
    : "Tratamento + Imagens para Uso Interno";

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [10, 15, 10, 15] as [number, number, number, number],
        filename: `consentimento_${consent.signed_by_name?.replace(/\s+/g, "_") ?? "cliente"}_${format(new Date(consent.signed_at || consent.created_at), "yyyy-MM-dd")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
      };
      await html2pdf().set(opt).from(printRef.current).save();
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            <span>Consentimento</span>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleDownloadPdf}>
              <Download className="w-3.5 h-3.5" /> Baixar PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Printable content */}
        <div ref={printRef} className="space-y-5 p-2">
          {/* Type badge */}
          <div className="py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Tipo</p>
            <p className="text-sm font-medium">{consentTypeLabel}</p>
          </div>

          {/* Document body */}
          <div className="py-2">
            <p className="text-sm whitespace-pre-line leading-relaxed">{consentText}</p>
          </div>

          {/* Date + Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Data</p>
              <p className="text-sm font-medium">{signedDate}</p>
            </div>
            <div className="py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Assinado por</p>
              <p className="text-sm font-medium">{consent.signed_by_name ?? "—"}</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Assinatura do(a) Cliente
              </p>
              <div className="border-b border-border pb-2 min-h-[120px] flex items-center justify-center">
                {clientSigUrl ? (
                  <img src={clientSigUrl} alt="Assinatura do cliente" className="max-h-[100px] max-w-full object-contain" />
                ) : (
                  <p className="text-xs text-muted-foreground">Sem assinatura</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Assinatura da Profissional
              </p>
              <div className="border-b border-border pb-2 min-h-[120px] flex items-center justify-center">
                {proSigUrl ? (
                  <img src={proSigUrl} alt="Assinatura da profissional" className="max-h-[100px] max-w-full object-contain" />
                ) : (
                  <p className="text-xs text-muted-foreground">Sem assinatura</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

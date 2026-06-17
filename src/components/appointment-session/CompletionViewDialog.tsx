import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Clock, User, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";

interface DocumentRecord {
  id: string;
  file_name: string;
  file_url: string;
  document_type: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentRecord;
}

export default function CompletionViewDialog({ open, onOpenChange, document: doc }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // Parse notes: "Serviço: X | Especialista: Y | 10:30 – 11:00"
  const parseNotes = (notes: string | null) => {
    if (!notes) return { serviceName: "", specialistName: "", timeRange: "" };
    const parts = notes.split("|").map((s) => s.trim());
    const serviceName = parts.find((p) => p.startsWith("Serviço:"))?.replace("Serviço:", "").trim() || "";
    const specialistName = parts.find((p) => p.startsWith("Especialista:"))?.replace("Especialista:", "").trim() || "";
    const timeRange = parts.find((p) => /^\d/.test(p)) || "";
    return { serviceName, specialistName, timeRange };
  };

  const { serviceName, specialistName, timeRange } = parseNotes(doc.notes);
  const docDate = format(new Date(doc.created_at), "d 'de' MMMM 'de' yyyy", { locale: pt });

  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUrl = async () => {
      if (!doc.file_url) { setSignatureUrl(null); return; }
      const { data } = await storage
        .from("consent-signatures")
        .createSignedUrl(doc.file_url, 3600);
      setSignatureUrl(data?.signedUrl ?? null);
    };
    if (open) loadUrl();
  }, [doc.file_url, open]);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [10, 15, 10, 15] as [number, number, number, number],
        filename: `presenca_${format(new Date(doc.created_at), "yyyy-MM-dd")}.pdf`,
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
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh] p-0 gap-0">
        {/* Header fixo */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle>Documento de Presença</DialogTitle>
        </DialogHeader>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div ref={printRef} className="space-y-5">
            <div className="py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Tipo</p>
              <p className="text-sm font-medium">Assinatura de Realização</p>
            </div>

            <div className="py-2">
              <p className="text-sm leading-relaxed">
                Confirmo que estive presente e realizei o procedimento descrito abaixo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Data</p>
                <p className="text-sm font-medium">{docDate}</p>
              </div>
              {timeRange && (
                <div className="py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Horário</p>
                  <p className="text-sm font-medium">{timeRange}</p>
                </div>
              )}
              {serviceName && (
                <div className="py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Serviço</p>
                  <p className="text-sm font-medium">{serviceName}</p>
                </div>
              )}
              {specialistName && (
                <div className="py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Especialista</p>
                  <p className="text-sm font-medium">{specialistName}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Assinatura do(a) Cliente
              </p>
              <div className="border-b border-border pb-2 min-h-[120px] flex items-center justify-center">
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Assinatura do cliente" className="max-h-[100px] max-w-full object-contain" />
                ) : (
                  <p className="text-xs text-muted-foreground">Sem assinatura</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer fixo com botão */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleDownloadPdf}>
            <Download className="w-3.5 h-3.5" /> Baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

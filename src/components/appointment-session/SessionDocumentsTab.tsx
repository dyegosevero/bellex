import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Eye, FileSignature } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import ConsentViewDialog from "./ConsentViewDialog";
import CompletionViewDialog from "./CompletionViewDialog";

interface Props {
  appointmentId: string;
  clientId: string;
}

export default function SessionDocumentsTab({ appointmentId, clientId }: Props) {
  const [viewConsent, setViewConsent] = useState<any | null>(null);
  const [viewDocument, setViewDocument] = useState<any | null>(null);

  const { data: consents, isLoading: consentsLoading } = useQuery({
    queryKey: ["client-all-consents", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_consents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["appointment-documents", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (consentsLoading || docsLoading) return <Skeleton className="h-64 w-full" />;

  const consentTypeLabel = (type: string) => {
    if (type === "treatment_social") return "Tratamento + Redes Sociais";
    if (type === "treatment_internal") return "Tratamento + Análise Interna";
    return type;
  };

  const docTypeLabel = (type: string) => {
    if (type === "completion_signature") return "Documento de Presença";
    if (type === "consent") return "Consentimento";
    return type;
  };

  const hasItems = (consents && consents.length > 0) || (documents && documents.length > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider">Documentos</h2>
      {consents && consents.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <FileSignature className="w-3.5 h-3.5" /> Consentimentos
          </h3>
          <div className="space-y-2">
            {consents.map((c: any) => (
              <div
                key={c.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{consentTypeLabel(c.consent_type)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.signed_by_name && `Assinado por ${c.signed_by_name}`}
                    {c.signed_at && ` · ${format(new Date(c.signed_at), "dd MMM yyyy 'às' HH:mm", { locale: pt })}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setViewConsent(c)}
                >
                  <Eye className="w-3 h-3" /> Ver Documento
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents && documents.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Documentos de Presença
          </h3>
          <div className="space-y-2">
            {documents.map((d: any) => (
              <div
                key={d.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {docTypeLabel(d.document_type)} · {format(new Date(d.created_at), "dd MMM yyyy", { locale: pt })}
                    {d.notes && ` · ${d.notes}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setViewDocument(d)}
                >
                  <Eye className="w-3 h-3" /> Ver Documento
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasItems && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm">Nenhum documento registrado para este atendimento.</p>
          <p className="text-xs mt-1">Consentimentos assinados na aba "Antes e Depois" aparecerão aqui.</p>
        </div>
      )}

      {viewConsent && (
        <ConsentViewDialog
          open={!!viewConsent}
          onOpenChange={(open) => !open && setViewConsent(null)}
          consent={viewConsent}
        />
      )}

      {viewDocument && (
        <CompletionViewDialog
          open={!!viewDocument}
          onOpenChange={(open) => !open && setViewDocument(null)}
          document={viewDocument}
        />
      )}
    </div>
  );
}

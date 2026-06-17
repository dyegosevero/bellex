import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileSignature, Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ConsentText {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  content: string;
  is_active: boolean;
  updated_at: string;
}

const DocumentsTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["consent-texts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consent_texts").select("*").order("label");
      if (error) throw error;
      return data as ConsentText[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("consent_texts").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consent-texts"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-light tracking-wider flex items-center gap-2">
            <FileSignature className="w-5 h-5" /> DOCUMENTOS
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Termos de consentimento e documentos para assinatura pelos clientes.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate("/documentos/novo")}>
          <Plus className="w-4 h-4" /> Novo Documento
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Nenhum documento criado ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{doc.label}</p>
                  {!doc.is_active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                </div>
                {doc.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.description}</p>}
                <p className="text-[11px] text-muted-foreground mt-1">
                  Atualizado em {format(new Date(doc.updated_at), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive.mutate({ id: doc.id, is_active: !doc.is_active })}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={doc.is_active ? "Desativar" : "Ativar"}
                >
                  {doc.is_active ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/documentos/${doc.id}`)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;

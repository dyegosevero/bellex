import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, FileSignature, Pencil, ToggleLeft, ToggleRight, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConsentText {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  content: string;
  is_active: boolean;
  updated_at: string;
}

export default function Documents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["consent-texts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_texts")
        .select("*")
        .order("label");
      if (error) throw error;
      return data as ConsentText[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("consent_texts")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consent-texts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-normal normal-case">Documentos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Termos de consentimento e documentos para assinatura pelos clientes.
            </p>
          </div>
          <Button onClick={() => navigate("/documentos/novo")} className="gap-2">
            <Plus size={15} /> Novo documento
          </Button>
        </div>
      </BlurFade>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <FileSignature size={32} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum documento criado ainda.</p>
          <Button variant="outline" onClick={() => navigate("/documentos/novo")}>
            Criar primeiro documento
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc, i) => (
            <BlurFade key={doc.id} delay={0.05 + i * 0.03}>
              <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card px-5 py-4 hover:shadow-sm transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileSignature size={15} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{doc.label}</p>
                    {!doc.is_active && (
                      <Badge variant="secondary" className="text-[10px]">Inativo</Badge>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.description}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    Atualizado em {format(new Date(doc.updated_at), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive.mutate({ id: doc.id, is_active: !doc.is_active })}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title={doc.is_active ? "Desativar" : "Ativar"}
                  >
                    {doc.is_active
                      ? <ToggleRight size={18} className="text-primary" />
                      : <ToggleLeft size={18} className="text-muted-foreground" />
                    }
                  </button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => navigate(`/documentos/${doc.id}`)}
                    className="gap-1.5"
                  >
                    <Pencil size={13} /> Editar
                  </Button>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
}

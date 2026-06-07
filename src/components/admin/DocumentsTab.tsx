import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileSignature, Save } from "lucide-react";

interface ConsentText {
  id: string;
  slug: string;
  label: string;
  content: string;
  updated_at: string;
}

const DocumentsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: texts, isLoading } = useQuery({
    queryKey: ["consent-texts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_texts")
        .select("*")
        .order("slug");
      if (error) throw error;
      return data as ConsentText[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <div className="mb-2">
        <h3 className="text-lg font-light tracking-wider flex items-center gap-2">
          <FileSignature className="w-5 h-5" /> DOCUMENTOS
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Edite os textos dos termos que os clientes assinam antes dos procedimentos.
        </p>
      </div>

      {Array.isArray(texts) && texts.map((t) => (
        <ConsentTextCard key={t.id} text={t} userId={user?.id} />
      ))}
    </div>
  );
};

const ConsentTextCard = ({ text, userId }: { text: ConsentText; userId?: string }) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(text.content);
  const isDirty = content !== text.content;

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("consent_texts")
        .update({ content, updated_by: userId, updated_at: new Date().toISOString() })
        .eq("id", text.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consent-texts"] });
      toast.success("Texto atualizado com sucesso.");
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold">{text.label}</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        {text.slug === "treatment_social"
          ? "Autoriza uso de imagens em redes sociais e materiais de comunicação"
          : "Autoriza uso de imagens apenas para registo clínico interno"}
      </p>

      <div className="bg-muted/40 rounded-md px-3 py-2">
        <p className="text-xs text-muted-foreground">
          <strong>Variáveis disponíveis:</strong>{" "}
          <code className="bg-muted px-1 rounded">{"{nome}"}</code> nome do cliente,{" "}
          <code className="bg-muted px-1 rounded">{"{cartao_cidadao}"}</code> nº cartão de cidadão,{" "}
          <code className="bg-muted px-1 rounded">{"{data}"}</code> data atual,{" "}
          <code className="bg-muted px-1 rounded">{"{servico}"}</code> nome do serviço,{" "}
          <code className="bg-muted px-1 rounded">{"{especialista}"}</code> nome do especialista
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Texto do termo</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="font-mono text-xs leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {text.updated_at
            ? `Última atualização: ${new Date(text.updated_at).toLocaleDateString("pt-PT")}`
            : ""}
        </p>
        <div className="flex gap-2">
          {isDirty && (
            <Button variant="ghost" size="sm" onClick={() => setContent(text.content)}>
              Descartar
            </Button>
          )}
          <Button size="sm" variant="outline" disabled={!isDirty || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {mutation.isPending ? "A gravar..." : "Gravar"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DocumentsTab;

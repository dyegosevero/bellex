import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor } from "@/components/ui/rich-editor";
import { BlurFade } from "@/components/ui/blur-fade";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, FileSignature, Info } from "lucide-react";

const VARIABLES = [
  { key: "{nome}", desc: "Nome do cliente" },
  { key: "{cartao_cidadao}", desc: "Nº cartão de cidadão" },
  { key: "{data}", desc: "Data atual" },
  { key: "{servico}", desc: "Nome do serviço" },
  { key: "{especialista}", desc: "Nome do especialista" },
];

export default function DocumentEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "novo";
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [isActive, setIsActive] = useState(true);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["consent-text", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("consent_texts")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (doc) {
      setLabel(doc.label ?? "");
      setDescription((doc as any).description ?? "");
      setContent(doc.content ?? "<p></p>");
      setIsActive((doc as any).is_active ?? true);
    }
  }, [doc]);

  const save = useMutation({
    mutationFn: async () => {
      const slug = isNew
        ? `doc_${Date.now()}`
        : doc?.slug;

      if (isNew) {
        const { error } = await supabase.from("consent_texts").insert({
          label,
          slug,
          content,
          description,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("consent_texts")
          .update({
            label,
            content,
            description,
            is_active: isActive,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", id!);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consent-texts"] });
      toast.success(isNew ? "Documento criado!" : "Documento salvo!");
      navigate("/documentos");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BlurFade delay={0.05}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/documentos")} className="gap-1.5">
            <ArrowLeft size={14} /> Voltar
          </Button>
          <h1 className="text-xl font-light tracking-normal normal-case">
            {isNew ? "Novo documento" : "Editar documento"}
          </h1>
        </div>
      </BlurFade>

      <BlurFade delay={0.08}>
        <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label>Nome do documento *</Label>
              <Input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Ex: Termo de consentimento padrão"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição interna <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Breve descrição para identificação interna"
              />
            </div>
          </div>

          {/* Variables reference */}
          <div className="rounded-xl bg-muted/40 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Info size={12} /> Variáveis disponíveis no texto
            </div>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map(v => (
                <div key={v.key} className="flex items-center gap-1.5 text-xs">
                  <code className="bg-background border border-border/50 px-2 py-0.5 rounded-md text-primary font-mono">
                    {v.key}
                  </code>
                  <span className="text-muted-foreground">{v.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rich editor */}
          <div className="space-y-1.5">
            <Label>Conteúdo do documento *</Label>
            <RichEditor
              value={content}
              onChange={setContent}
            />
          </div>

          {/* Active toggle */}
          {!isNew && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/40">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <Label htmlFor="is_active" className="cursor-pointer font-normal">
                Documento ativo (disponível para atribuir a serviços)
              </Label>
            </div>
          )}
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/documentos")}>
            Cancelar
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={!label.trim() || !content || save.isPending}
            className="gap-2"
          >
            {save.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
              : <><Save size={14} /> Salvar documento</>
            }
          </Button>
        </div>
      </BlurFade>
    </div>
  );
}

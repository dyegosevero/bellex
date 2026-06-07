import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, MessageSquarePlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  clientId: string;
  specialistId: string | null;
  clientName: string;
  onSubmitted?: () => void;
  /** If true, user can skip feedback (e.g. when concluding appointment) */
  allowSkip?: boolean;
  onSkip?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Péssimo",
  2: "Muito ruim",
  3: "Ruim",
  4: "Abaixo da média",
  5: "Na média",
  6: "Acima da média",
  7: "Bom",
  8: "Muito bom",
  9: "Excelente",
  10: "Perfeito!",
};

const RATING_COLORS: Record<number, string> = {
  1: "text-destructive",
  2: "text-destructive",
  3: "text-destructive/80",
  4: "text-[hsl(var(--warning))]",
  5: "text-[hsl(var(--warning))]",
  6: "text-[hsl(var(--warning))]",
  7: "text-primary",
  8: "text-primary",
  9: "text-[hsl(var(--success))]",
  10: "text-[hsl(var(--success))]",
};

export default function FeedbackDialog({
  open, onOpenChange, appointmentId, clientId, specialistId, clientName,
  onSubmitted, allowSkip, onSkip,
}: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const activeRating = hovered || rating;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma nota de 1 a 10.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("appointment_feedback").insert({
      appointment_id: appointmentId,
      client_id: clientId,
      specialist_id: specialistId,
      rating,
      comment: comment.trim() || null,
      collected_by: user?.id ?? null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Feedback já registrado para este atendimento.");
      } else {
        toast.error("Erro ao registrar feedback.");
      }
    } else {
      toast.success("Feedback registrado com sucesso!");
      setRating(0);
      setComment("");
      onOpenChange(false);
      onSubmitted?.();
    }
    setSaving(false);
  };

  const handleSkip = () => {
    setRating(0);
    setComment("");
    onOpenChange(false);
    onSkip?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header with accent background */}
        <div className="bg-primary/5 border-b border-border px-8 pt-8 pb-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquarePlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-light tracking-wider">
                  Feedback do Atendimento
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Como foi a experiência de{" "}
                  <span className="font-semibold text-foreground">{clientName}</span>?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-8">
          {/* Star rating 1-10 */}
          <div className="text-center space-y-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Nota de Satisfação
            </p>
            <div className="flex gap-1.5 justify-center">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className="p-1 transition-all duration-150 hover:scale-125 active:scale-95"
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(n)}
                >
                  <Star
                    className={cn(
                      "w-7 h-7 transition-all duration-150",
                      n <= activeRating
                        ? "fill-primary text-primary drop-shadow-sm"
                        : "text-muted-foreground/20"
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="h-8 flex items-center justify-center gap-2">
              {activeRating > 0 ? (
                <>
                  <span className={cn("text-2xl font-bold tabular-nums", RATING_COLORS[activeRating] ?? "text-foreground")}>
                    {activeRating}
                  </span>
                  <span className="text-sm text-muted-foreground">/10</span>
                  <span className="text-sm font-medium ml-1">
                    — {RATING_LABELS[activeRating]}
                  </span>
                  {activeRating >= 9 && <Sparkles className="w-4 h-4 text-[hsl(var(--success))] animate-pulse" />}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Passe o rato sobre as estrelas para avaliar</span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Comentário <span className="normal-case font-normal">(opcional)</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="O que o cliente comentou sobre o atendimento?"
              rows={4}
              className="resize-none text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-8 py-5 flex items-center justify-between bg-muted/30">
          <div>
            {allowSkip && (
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                Pular por agora
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving || rating === 0} size="lg">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

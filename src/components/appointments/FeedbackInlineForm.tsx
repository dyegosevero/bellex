import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  show: boolean;
  appointmentId: string;
  clientId: string;
  specialistId: string | null;
  clientName: string;
  onSubmitted?: () => void;
  onCancel: () => void;
  embedded?: boolean;
}

export default function FeedbackInlineForm({
  show, appointmentId, clientId, specialistId, clientName, onSubmitted, onCancel, embedded,
}: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  if (!show) return null;

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
      onSubmitted?.();
    }
    setSaving(false);
  };

  const content = (
    <>
      {!embedded && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-1">Registrar Feedback</h3>
          <p className="text-xs text-muted-foreground">
            Avaliação de <span className="font-medium text-foreground">{clientName}</span>
          </p>
        </div>
      )}

      {/* Star rating 1-10 */}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Nota (1 a 10)</p>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className="p-0.5 transition-transform hover:scale-110"
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(n)}
            >
              <Star
                className={cn(
                  "w-6 h-6 transition-colors",
                  n <= (hovered || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && <p className="text-sm mt-2 font-medium">{rating}/10</p>}
      </div>

      {/* Comment */}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Comentário (opcional)</p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="O que o cliente achou do atendimento?"
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={saving || rating === 0}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Registrar Feedback
        </Button>
        {!embedded && <Button variant="outline" onClick={onCancel}>Cancelar</Button>}
      </div>
    </>
  );

  if (embedded) return <div className="space-y-5 mt-2">{content}</div>;
  return <div className="bg-card border border-border rounded-lg p-5 space-y-5">{content}</div>;
}

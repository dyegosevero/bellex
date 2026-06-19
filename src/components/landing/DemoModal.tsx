import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, CheckCircle2 } from "lucide-react";

function maskPhone(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.replace(/^(\d{0,2})/, "($1");
  if (digits.length <= 7) return digits.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoModal({ open, onOpenChange }: DemoModalProps) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", clinic: "", whatsapp: "", specialty: "" });

  // Radix Dialog adds overflow:hidden to body — undo it so page stays scrollable
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      document.body.style.overflow = "";
      document.body.style.removeProperty("padding-right");
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate send — swap with real API call
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  }

  function handleClose(v: boolean) {
    onOpenChange(v);
    if (!v) setTimeout(() => setSent(false), 300);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header colorido */}
        <div
          className="px-8 pt-8 pb-6"
          style={{ background: "linear-gradient(135deg, hsl(10 60% 93%) 0%, hsl(30 50% 95%) 100%)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <Calendar size={15} className="text-primary" />
            </div>
            <span className="text-xs text-primary font-medium tracking-widest uppercase">Demo gratuita</span>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-light normal-case tracking-normal text-foreground">
              Conheça a Bellex em 30 minutos.
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Sem compromisso. Mostramos tudo ao vivo com dados reais da sua especialidade.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {sent ? (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <CheckCircle2 size={40} className="text-primary" />
              <p className="text-base font-medium text-foreground">Recebemos seu contato!</p>
              <p className="text-sm text-muted-foreground">
                Nossa equipe vai entrar em contato pelo WhatsApp em até 1 hora útil para confirmar o horário.
              </p>
              <button
                onClick={() => handleClose(false)}
                className="mt-2 text-sm text-primary font-medium hover:underline"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Seu nome</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Maria Silva"
                    className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Nome da clínica</label>
                  <input
                    required
                    value={form.clinic}
                    onChange={e => setForm(f => ({ ...f, clinic: e.target.value }))}
                    placeholder="Clínica Exemplo"
                    className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">WhatsApp</label>
                <input
                  required
                  value={form.whatsapp}
                  onChange={e => setForm(f => ({ ...f, whatsapp: maskPhone(e.target.value) }))}
                  placeholder="(11) 99999-0000"
                  type="tel"
                  inputMode="numeric"
                  maxLength={15}
                  className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Especialidade</label>
                <Select value={form.specialty} onValueChange={v => setForm(f => ({ ...f, specialty: v }))}>
                  <SelectTrigger className="h-10 rounded-xl border-border/60 text-sm focus:ring-primary/10">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estetica">Estética facial e corporal</SelectItem>
                    <SelectItem value="dermatologia">Dermatologia</SelectItem>
                    <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                    <SelectItem value="odontologia">Odontologia</SelectItem>
                    <SelectItem value="psicologia">Psicologia</SelectItem>
                    <SelectItem value="nutricao">Nutrição</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-primary text-white text-sm font-medium transition-all hover:bg-primary/90 disabled:opacity-60 mt-1"
              >
                {loading ? "Enviando..." : "Quero agendar minha demo →"}
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                30 min · sem compromisso · com sua equipe
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

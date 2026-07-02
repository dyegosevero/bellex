import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FadeUp } from "./utils";
import { BrandGrain } from "@/components/BrandGrain";

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.replace(/^(\d{0,2})/, "($1");
  if (d.length <= 7) return d.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function LandingCta() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", clinic: "", whatsapp: "", specialty: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  }

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <BrandGrain />
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Left — headline */}
          <FadeUp>
            <p className="text-xs text-white/60 tracking-widest uppercase font-medium mb-5">Demo gratuita · 30 min</p>
            <h2 className="font-heading text-5xl md:text-6xl font-light tracking-tight text-white leading-tight mb-6">
              Chega de apagar<br />
              incêndio todo dia.
            </h2>
            <p className="text-white/70 font-light leading-relaxed mb-8 max-w-sm">
              Veja ao vivo como clínicas como a sua estão usando a Bellex pra sair do caos e entrar no controle — em menos de uma semana.
            </p>
            <ul className="space-y-2.5">
              {[
                "Sem compromisso e sem cartão",
                "Demo com dados do seu segmento",
                "Nossa equipe configura tudo por você",
              ].map(t => (
                <li key={t} className="flex items-center gap-2.5 text-sm text-white/75">
                  <CheckCircle2 size={14} className="text-white/50 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </FadeUp>

          {/* Right — form */}
          <FadeUp delay={120}>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-7">
              {sent ? (
                <div className="flex flex-col items-center text-center py-8 gap-4">
                  <CheckCircle2 size={44} className="text-white" />
                  <p className="text-lg font-medium text-white">Recebemos seu contato!</p>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Nossa equipe vai entrar em contato pelo WhatsApp em até 1 hora útil para confirmar o horário.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <p className="text-white font-medium text-sm mb-4">Agende sua demo gratuita</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-white/60 font-medium block mb-1">Seu nome</label>
                      <input
                        required
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Maria Silva"
                        className="w-full h-10 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/30 px-3 text-sm outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/60 font-medium block mb-1">Clínica</label>
                      <input
                        required
                        value={form.clinic}
                        onChange={e => setForm(f => ({ ...f, clinic: e.target.value }))}
                        placeholder="Nome da clínica"
                        className="w-full h-10 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/30 px-3 text-sm outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-white/60 font-medium block mb-1">WhatsApp</label>
                    <input
                      required
                      value={form.whatsapp}
                      onChange={e => setForm(f => ({ ...f, whatsapp: maskPhone(e.target.value) }))}
                      placeholder="(11) 99999-0000"
                      type="tel"
                      inputMode="numeric"
                      maxLength={15}
                      className="w-full h-10 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/30 px-3 text-sm outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/60 font-medium block mb-1">Especialidade</label>
                    <Select value={form.specialty} onValueChange={v => setForm(f => ({ ...f, specialty: v }))}>
                      <SelectTrigger className="h-10 rounded-xl border-white/20 bg-white/10 text-white text-sm focus:ring-white/20 [&>span]:text-white/60 data-[placeholder]:text-white/30">
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
                    className="w-full h-11 rounded-xl bg-white text-primary text-sm font-medium transition-all hover:bg-white/90 disabled:opacity-60 mt-1"
                  >
                    {loading ? "Enviando..." : "Quero agendar minha demo →"}
                  </button>
                  <p className="text-center text-[11px] text-white/40">30 min · sem compromisso · com sua equipe</p>
                </form>
              )}
            </div>
          </FadeUp>

        </div>
      </div>
    </section>
  );
}

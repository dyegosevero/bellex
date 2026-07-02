import { Layers, Palette, Globe, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { FadeUp } from "./utils";

const items = [
  {
    icon: Palette,
    title: "Sua marca, sua identidade",
    desc: "Logo, cores, domínio próprio. O paciente vê sua clínica — não um software de terceiro.",
  },
  {
    icon: Globe,
    title: "Domínio e app com seu nome",
    desc: "agenda.suaclinica.com.br. Tudo rodando sob o seu domínio, sem rastro da Bellex.",
  },
  {
    icon: Layers,
    title: "Plataforma completa, zero infraestrutura",
    desc: "Você não gerencia servidor, banco de dados nem atualizações. A gente cuida de tudo.",
  },
  {
    icon: TrendingUp,
    title: "Escala sem custo fixo proporcional",
    desc: "Abriu uma filial? Ativa mais uma clínica no painel. Não precisa contratar mais nada.",
  },
];

export function LandingWhiteLabel() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeUp className="mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-3.5 py-1.5 mb-5">
            <span className="text-xs font-medium text-primary tracking-widest uppercase">White-label</span>
          </div>
          <h2 className="text-4xl font-light leading-tight text-balance max-w-lg">
            A plataforma é nossa.<br />
            <span className="text-primary/60">A marca é sua.</span>
          </h2>
          <p className="mt-4 text-muted-foreground font-light max-w-md leading-relaxed">
            Sua clínica não precisa aparecer como "usuária de um software". Com a Bellex, você entrega uma experiência com a sua identidade — do login à confirmação de consulta.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 gap-5">
          {items.map((item, i) => (
            <FadeUp key={item.title} delay={i * 80}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex gap-4 p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/20 hover:shadow-[0_6px_30px_-10px_hsl(10_75%_77%/0.2)] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon size={17} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

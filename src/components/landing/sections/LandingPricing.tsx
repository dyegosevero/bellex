import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Minus } from "lucide-react";
import { FadeUp } from "./utils";
import { plans, compareRows } from "./data";

export function LandingPricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="precos" className="py-24 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <FadeUp className="mb-14 text-center">
          <p className="text-xs text-primary tracking-widest uppercase font-medium mb-4">Planos</p>
          <h2 className="font-heading text-4xl md:text-5xl font-light tracking-tight text-foreground">
            Simples e transparente.
          </h2>
          <p className="text-muted-foreground mt-3 font-light">
            7 dias grátis, sem cartão de crédito.
          </p>

          {/* Toggle mensal/anual */}
          <div className="mt-8 inline-flex items-center gap-3 bg-muted/50 border border-border rounded-full px-1.5 py-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm px-4 py-1.5 rounded-full transition-all ${!annual ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground"}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`text-sm px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${annual ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground"}`}
            >
              Anual
              <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-medium">
                -30%
              </span>
            </button>
          </div>
        </FadeUp>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p, i) => {
            const price = annual ? p.price.annual : p.price.monthly;
            const note = annual ? p.annualNote : "";
            return (
              <FadeUp key={p.name} delay={i * 80}>
                <div
                  className={`p-7 rounded-2xl border h-full flex flex-col gap-6 ${
                    p.highlighted
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-background"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      {p.highlighted && (
                        <span className="text-[10px] bg-primary text-white px-2.5 py-1 rounded-full font-medium tracking-wide">
                          Mais escolhido
                        </span>
                      )}
                    </div>
                    <div className="mb-0.5">
                      <span className="font-heading text-4xl font-light tracking-tight text-foreground">
                        {price}
                      </span>
                      {p.period && (
                        <span className="text-sm ml-1 text-muted-foreground">{p.period}</span>
                      )}
                    </div>
                    {note && (
                      <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
                    )}
                    <p className="text-sm text-muted-foreground font-light mt-2">{p.desc}</p>
                  </div>

                  {p.name !== "Enterprise" && (
                    <p className="text-xs text-primary font-medium -mt-2">
                      ✓ 7 dias grátis · sem cartão de crédito
                    </p>
                  )}

                  <ul className="space-y-2.5 flex-1">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-sm">
                        <Check size={13} className="text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/login"
                    className={`text-center text-sm font-medium px-6 py-3 rounded-xl transition-all ${
                      p.highlighted
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "border border-border text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {p.cta}
                  </Link>
                </div>
              </FadeUp>
            );
          })}
        </div>

        {/* Tabela comparativa */}
        <FadeUp delay={200} className="mt-16">
          <h3 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">
            Compare os planos
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-4 text-muted-foreground font-normal w-1/2">Recurso</th>
                  <th className="px-5 py-4 text-center text-foreground font-medium">Starter</th>
                  <th className="px-5 py-4 text-center text-primary font-medium bg-primary/5">Pro</th>
                  <th className="px-5 py-4 text-center text-foreground font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                  >
                    <td className="px-5 py-3.5 text-muted-foreground">{row.label}</td>
                    <td className="px-5 py-3.5 text-center">{renderCell(row.starter)}</td>
                    <td className="px-5 py-3.5 text-center bg-primary/5">{renderCell(row.pro)}</td>
                    <td className="px-5 py-3.5 text-center">{renderCell(row.enterprise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeUp>

        {/* Trust signals */}
        <FadeUp delay={280}>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              "Dados protegidos e criptografados (LGPD)",
              "Sistema 100% na nuvem — sem instalação",
              "Suporte em português via chat",
              "Atualizações incluídas no plano",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2 text-xs text-muted-foreground text-left">
                <Check size={13} className="text-primary mt-0.5 flex-shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function renderCell(val: string | boolean) {
  if (val === true) return <Check size={15} className="text-primary mx-auto" />;
  if (val === false) return <X size={14} className="text-muted-foreground/40 mx-auto" />;
  if (val === "—") return <Minus size={14} className="text-muted-foreground/40 mx-auto" />;
  return <span className="text-muted-foreground text-xs">{val}</span>;
}

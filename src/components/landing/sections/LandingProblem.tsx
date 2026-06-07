import { AlertCircle } from "lucide-react";
import { problems } from "./data";

export function LandingProblem() {
  return (
    <section className="py-16 md:py-32 bg-background">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-10 md:grid-cols-2 md:gap-20">
          <div>
            <h2 className="text-4xl font-light leading-tight normal-case tracking-normal text-balance">
              Clínicas que crescem{" "}
              <span className="text-muted-foreground font-normal">travam na gestão.</span>
            </h2>
          </div>
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Não é falta de clientes.{" "}
              <span className="text-foreground font-medium">É excesso de processo manual</span>{" "}
              — agenda no papel, cobrança esquecida, clientes que somem sem retornar. A clínica trabalha mais e fatura menos do que poderia.
            </p>
            <div className="space-y-3 pt-2">
              {problems.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <AlertCircle size={13} className="text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-snug">{p.text}</p>
                </div>
              ))}
            </div>
            <div className="border-l-4 border-primary/40 pl-4 space-y-0.5">
              <p className="text-sm font-medium text-foreground">Com a Bellex, isso muda no primeiro mês.</p>
              <p className="text-sm text-muted-foreground">Tudo centralizado. Automático. Sem planilha.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

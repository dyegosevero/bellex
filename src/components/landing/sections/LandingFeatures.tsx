import { Link } from "react-router-dom";
import { features } from "./data";
import { FeatureMockupTabs } from "@/components/landing/FeatureMockups";

export function LandingFeatures() {
  return (
    <section className="py-16 md:py-32" style={{ background: "hsl(30 20% 97%)" }}>
      <div className="mx-auto max-w-5xl space-y-12 px-6">
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <h2 className="text-balance text-4xl font-medium">Um sistema. Tudo que a clínica precisa.</h2>
          <p className="text-muted-foreground">Da agenda ao marketing — cada funcionalidade elimina trabalho manual e devolve tempo para cuidar de pacientes.</p>
        </div>

        <FeatureMockupTabs />

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-8 md:grid-cols-3">
          {features.map((f) => (
            <Link key={f.title} to={f.href} className="group space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <f.icon size={14} className="text-primary flex-shrink-0" />
                <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{f.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

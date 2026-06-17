import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FITZPATRICK = [
  { tipo: "I", cor: "#F7E8D4", label: "Tipo 1" },
  { tipo: "II", cor: "#EDD4AE", label: "Tipo 2" },
  { tipo: "III", cor: "#D4A574", label: "Tipo 3" },
  { tipo: "IV", cor: "#A0714F", label: "Tipo 4" },
  { tipo: "V", cor: "#6B4A2E", label: "Tipo 5" },
  { tipo: "VI", cor: "#3A2215", label: "Tipo 6" },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold uppercase tracking-wider text-primary border-b border-border pb-2">
      {title}
    </h3>
    {children}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
    {children}
  </div>
);

const IllustrationPlaceholder = ({ label, height = 120 }: { label: string; height?: number }) => (
  <div
    className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground text-xs text-center px-4"
    style={{ height }}
  >
    {label}
  </div>
);

const PhotoPlaceholder = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-full aspect-square max-w-[120px] rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground text-[10px] text-center px-2">
      Foto
    </div>
    <span className="text-xs text-muted-foreground text-center">{label}</span>
  </div>
);

const INITIAL: Record<string, any> = {
  fototipo: "",
  baumann_hidratacao: "",
  baumann_sensibilidade: "",
  baumann_pigmentacao: "",
  acne_grau: "",
  acne_localizacao: "",
  cicatrizes: [] as string[],
  cicatrizes_localizacao: "",
  rosacea_subtipos: [] as string[],
  discromia_localizacao: "",
  tipo_discromia: "",
  hiperpig_periocular: "",
  observacoes: "",
};

interface Props {
  readOnly?: boolean;
  defaultValues?: Record<string, any>;
  onChange?: (data: Record<string, any>) => void;
}

export const FichaFacial = ({ readOnly = false, defaultValues, onChange }: Props) => {
  const [form, setForm] = useState<Record<string, any>>(() => ({ ...INITIAL, ...defaultValues }));

  useEffect(() => { onChange?.(form); }, [form, onChange]);

  const update = (key: string, value: any) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleList = (key: string, val: string) => {
    const cur: string[] = form[key] ?? [];
    update(key, cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val]);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold tracking-wider uppercase">Ficha Facial</h2>
      </div>

      {/* Fitzpatrick */}
      <Section title="Escala de Fitzpatrick">
        <div className="flex gap-3 flex-wrap">
          {FITZPATRICK.map((f) => (
            <button
              key={f.tipo}
              type="button"
              disabled={readOnly}
              onClick={() => update("fototipo", f.tipo)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-16 h-20 rounded-lg border-2 transition-all"
                style={{
                  background: f.cor,
                  borderColor: form.fototipo === f.tipo ? "#C4A882" : "transparent",
                  boxShadow:
                    form.fototipo === f.tipo
                      ? "0 0 0 3px rgba(196,168,130,.3)"
                      : "0 1px 4px rgba(0,0,0,.15)",
                }}
              />
              <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Baumann */}
      <Section title="Tipo de Pele de Baumann">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Hidratação">
            <Select value={form.baumann_hidratacao} onValueChange={(v) => update("baumann_hidratacao", v)} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="seca">Seca (D)</SelectItem>
                <SelectItem value="oleosa">Oleosa (O)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Sensibilidade">
            <Select value={form.baumann_sensibilidade} onValueChange={(v) => update("baumann_sensibilidade", v)} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sensivel">Sensível (S)</SelectItem>
                <SelectItem value="resistente">Resistente (R)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Pigmentação">
            <Select value={form.baumann_pigmentacao} onValueChange={(v) => update("baumann_pigmentacao", v)} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pigmentada">Pigmentada (P)</SelectItem>
                <SelectItem value="nao_pigmentada">Não pigmentada (N)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Acne */}
      <Section title="Grau da Acne">
        <table className="w-full text-sm border-collapse border border-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="border border-border px-3 py-2 text-left font-medium w-24">Grau</th>
              <th className="border border-border px-3 py-2 text-left font-medium">Tipo</th>
              <th className="border border-border px-3 py-2 text-left font-medium">Lesão</th>
            </tr>
          </thead>
          <tbody>
            {[
              { grau: "Grau I", tipo: "Não-inflamatório", lesao: "Comedónica" },
              { grau: "Grau II", tipo: "Inflamatório", lesao: "Pápulo-pustulosa" },
              { grau: "Grau III", tipo: "Inflamatório", lesao: "Nódulo-quística" },
              { grau: "Grau IV", tipo: "Inflamatório", lesao: "Conglobata" },
              { grau: "Grau V", tipo: "Inflamatório", lesao: "Fulminans" },
            ].map((row) => (
              <tr
                key={row.grau}
                className={`cursor-pointer transition-colors ${form.acne_grau === row.grau ? "bg-primary/10" : "hover:bg-muted/30"}`}
                onClick={() => !readOnly && update("acne_grau", form.acne_grau === row.grau ? "" : row.grau)}
              >
                <td className="border border-border px-3 py-2 font-medium">{row.grau}</td>
                <td className="border border-border px-3 py-2 text-muted-foreground">{row.tipo}</td>
                <td className="border border-border px-3 py-2">{row.lesao}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Field label="Localização anatômica">
          <Input value={form.acne_localizacao} onChange={(e) => update("acne_localizacao", e.target.value)} readOnly={readOnly} />
        </Field>
      </Section>

      {/* Cicatrizes de acne */}
      <Section title="Cicatrizes de Acne">
        <p className="text-xs text-muted-foreground">
          Aguardando fotos clínicas da ilustradora. Selecione os tipos presentes:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Icepick", "Boxcar", "Rolling", "Hipertrófica"].map((tipo) => (
            <label key={tipo} className="flex flex-col items-center gap-2 cursor-pointer">
              <PhotoPlaceholder label={tipo} />
              <div className="flex items-center gap-1.5">
                <Checkbox
                  checked={(form.cicatrizes ?? []).includes(tipo)}
                  onCheckedChange={() => toggleList("cicatrizes", tipo)}
                  disabled={readOnly}
                />
                <span className="text-xs">{tipo}</span>
              </div>
            </label>
          ))}
        </div>
        <Field label="Localização anatômica">
          <Input value={form.cicatrizes_localizacao} onChange={(e) => update("cicatrizes_localizacao", e.target.value)} readOnly={readOnly} />
        </Field>
      </Section>

      {/* Rosácea */}
      <Section title="Subtipos e Grau de Rosácea">
        <p className="text-xs text-muted-foreground mb-2">
          Aguardando fotos clínicas da ilustradora.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Subtipo 1", "Subtipo 2", "Subtipo 3", "Subtipo 4"].map((sub) => (
            <label key={sub} className="flex flex-col items-center gap-2 cursor-pointer">
              <PhotoPlaceholder label={sub} />
              <div className="flex items-center gap-1.5">
                <Checkbox
                  checked={(form.rosacea_subtipos ?? []).includes(sub)}
                  onCheckedChange={() => toggleList("rosacea_subtipos", sub)}
                  disabled={readOnly}
                />
                <span className="text-xs">{sub}</span>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Discromia */}
      <Section title="Discromia Facial">
        <div className="grid grid-cols-3 gap-4">
          {["Localização 1\n(Testa)", "Localização 2\n(Bochechas)", "Localização 3\n(Mento)"].map((loc, i) => (
            <label key={i} className="flex flex-col items-center gap-2 cursor-pointer">
              <IllustrationPlaceholder label={`Ilustração: rosto com\nmancha — ${loc}`} height={140} />
              <div className="flex items-center gap-1.5">
                <Checkbox
                  checked={(form.discromia_localizacao ?? "").includes(`loc${i + 1}`)}
                  onCheckedChange={() => {
                    const cur = form.discromia_localizacao ?? "";
                    const tag = `loc${i + 1}`;
                    update("discromia_localizacao", cur.includes(tag) ? cur.replace(tag, "").trim() : `${cur} ${tag}`.trim());
                  }}
                  disabled={readOnly}
                />
                <span className="text-xs">Localização {i + 1}</span>
              </div>
            </label>
          ))}
        </div>
        <Field label="Tipo de Discromia">
          <Input value={form.tipo_discromia} onChange={(e) => update("tipo_discromia", e.target.value)} readOnly={readOnly} />
        </Field>
      </Section>

      {/* Hiperpigmentação periocular */}
      <Section title="Tipo de Hiperpigmentação Periocular">
        <p className="text-xs text-muted-foreground mb-2">
          Aguardando fotos clínicas da ilustradora.
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => update("hiperpig_periocular", String(n))}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-full aspect-square rounded-lg border-2 bg-muted/30 flex items-center justify-center text-xs text-muted-foreground transition-colors ${form.hiperpig_periocular === String(n) ? "border-primary/60 bg-primary/5" : "border-dashed border-border"}`}
              >
                Foto
              </div>
              <span className="text-xs text-muted-foreground">Tipo {n}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Observações */}
      <Section title="Observações">
        <Textarea
          value={form.observacoes}
          onChange={(e) => update("observacoes", e.target.value)}
          readOnly={readOnly}
          rows={4}
        />
      </Section>
    </div>
  );
};

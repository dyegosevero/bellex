import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const IllustrationPlaceholder = ({ label, height = 160 }: { label: string; height?: number }) => (
  <div
    className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground text-xs text-center px-3"
    style={{ height }}
  >
    {label}
  </div>
);

const PhotoPlaceholder = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground text-[10px] text-center px-2">
      Foto
    </div>
    <span className="text-xs text-muted-foreground text-center">{label}</span>
  </div>
);

// IMC calculation
function calcIMC(peso: number, alturaCm: number) {
  if (!peso || !alturaCm) return null;
  const alturaM = alturaCm / 100;
  return peso / (alturaM * alturaM);
}

function classifyIMC(imc: number): { tipo: string; risco: string } {
  if (imc < 18.5) return { tipo: "Abaixo do peso", risco: "Baixo" };
  if (imc < 25) return { tipo: "Peso normal", risco: "Normal" };
  if (imc < 30) return { tipo: "Sobrepeso", risco: "Elevado" };
  if (imc < 35) return { tipo: "Obesidade Grau I", risco: "Alto" };
  if (imc < 40) return { tipo: "Obesidade Grau II", risco: "Muito alto" };
  return { tipo: "Obesidade Grau III", risco: "Extremamente alto" };
}

const DOBRAS = ["Tricipital", "Subescapular", "Bicipital", "Axilar", "Suprailiaca", "Abdominal", "Coxa", "Panturrilha"];

const PERIMETRIA_COLS = [
  ["Braço", "Tórax", "Quadril", "Panturrilha", "Fêmur"],
  ["Braço Contraído", "Cintura", "Coxa mediana", "Ombro"],
];

const INITIAL: Record<string, any> = {
  gordura_tipo: "",
  peso: "",
  altura: "",
  adipometria_protocolo: "",
  dobras: {} as Record<string, [string, string, string]>,
  perimetria: {} as Record<string, string>,
  celulite_grau: "",
  estrias_tipo: "",
  estrias_obs: "",
  diastase_teste: "",
  diastase_tipo: "",
  diastase_obs: "",
  aparencia_percebida: "",
  aparencia_desejada: "",
  observacoes: "",
};

interface Props {
  readOnly?: boolean;
  defaultValues?: Record<string, any>;
  onChange?: (data: Record<string, any>) => void;
}

export const FichaCorporal = ({ readOnly = false, defaultValues, onChange }: Props) => {
  const [form, setForm] = useState<Record<string, any>>(() => ({
    ...INITIAL,
    dobras: {},
    perimetria: {},
    ...defaultValues,
  }));

  useEffect(() => { onChange?.(form); }, [form, onChange]);

  const update = (key: string, value: any) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const imc = useMemo(() => {
    const peso = parseFloat(form.peso);
    const altura = parseFloat(form.altura);
    return calcIMC(peso, altura);
  }, [form.peso, form.altura]);

  const imcClass = imc ? classifyIMC(imc) : null;

  const updateDobra = (dobra: string, idx: 0 | 1 | 2, val: string) => {
    if (readOnly) return;
    const cur: [string, string, string] = form.dobras?.[dobra] ?? ["", "", ""];
    const next: [string, string, string] = [...cur] as [string, string, string];
    next[idx] = val;
    setForm((prev) => ({ ...prev, dobras: { ...prev.dobras, [dobra]: next } }));
  };

  const getMediana = (dobra: string): string => {
    const vals = (form.dobras?.[dobra] ?? ["", "", ""])
      .map((v: string) => parseFloat(v))
      .filter((n: number) => !isNaN(n))
      .sort((a: number, b: number) => a - b);
    if (vals.length === 0) return "—";
    if (vals.length === 1) return vals[0].toFixed(2);
    if (vals.length === 2) return ((vals[0] + vals[1]) / 2).toFixed(2);
    return vals[1].toFixed(2);
  };

  const updatePerimetria = (zona: string, val: string) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, perimetria: { ...prev.perimetria, [zona]: val } }));
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold tracking-wider uppercase">Ficha Corporal</h2>
      </div>

      {/* Distribuição de gordura */}
      <Section title="Distribuição de Gordura Corporal">
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          {["Androide", "Ginoide"].map((tipo) => (
            <button
              key={tipo}
              type="button"
              disabled={readOnly}
              onClick={() => update("gordura_tipo", tipo)}
              className="flex flex-col gap-2"
            >
              <IllustrationPlaceholder
                label={`Ilustração: silhueta ${tipo.toLowerCase()}`}
                height={180}
              />
              <div className={`text-center text-sm font-medium py-1 rounded transition-colors ${form.gordura_tipo === tipo ? "text-primary" : "text-muted-foreground"}`}>
                {tipo}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* IMC */}
      <Section title="Cálculo de IMC">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
          <Field label="Peso (kg)">
            <Input
              type="number"
              inputMode="decimal"
              value={form.peso}
              onChange={(e) => update("peso", e.target.value)}
              readOnly={readOnly}
              placeholder="kg"
            />
          </Field>
          <Field label="Altura (cm)">
            <Input
              type="number"
              inputMode="decimal"
              value={form.altura}
              onChange={(e) => update("altura", e.target.value)}
              readOnly={readOnly}
              placeholder="cm"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">IMC</p>
            <p className="text-lg font-semibold">{imc ? imc.toFixed(1) : "—"}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Tipo de obesidade</p>
            <p className="text-sm font-medium">{imcClass?.tipo ?? "—"}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Grau de risco</p>
            <p className="text-sm font-medium">{imcClass?.risco ?? "—"}</p>
          </div>
        </div>
      </Section>

      {/* Adipometria */}
      <Section title="Adipometria — Protocolo Petróski">
        <div className="mb-2">
          <Field label="Protocolo">
            <Select value={form.adipometria_protocolo} onValueChange={(v) => update("adipometria_protocolo", v)} disabled={readOnly}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Selecionar protocolo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="petroski_3">Petróski 3 dobras</SelectItem>
                <SelectItem value="petroski_4">Petróski 4 dobras</SelectItem>
                <SelectItem value="durnin">Durnin & Womersley</SelectItem>
                <SelectItem value="pollock_3">Pollock 3 dobras</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <p className="text-xs text-muted-foreground mt-1">
            Utilize o Protocolo de Petróski para calcular o percentual de gordura.
          </p>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-3 py-2 text-left font-medium w-36">Dobra</th>
                <th className="border border-border px-2 py-2 text-center font-medium">1ª Medida</th>
                <th className="border border-border px-2 py-2 text-center font-medium">2ª Medida</th>
                <th className="border border-border px-2 py-2 text-center font-medium">3ª Medida</th>
                <th className="border border-border px-3 py-2 text-center font-medium">Mediana</th>
              </tr>
            </thead>
            <tbody>
              {DOBRAS.map((dobra) => (
                <tr key={dobra}>
                  <td className="border border-border px-3 py-1.5 font-medium text-xs">{dobra}</td>
                  {([0, 1, 2] as const).map((i) => (
                    <td key={i} className="border border-border p-1">
                      <Input
                        className="h-7 w-full text-xs text-center"
                        placeholder="mm"
                        inputMode="decimal"
                        value={form.dobras?.[dobra]?.[i] ?? ""}
                        onChange={(e) => updateDobra(dobra, i, e.target.value)}
                        readOnly={readOnly}
                      />
                    </td>
                  ))}
                  <td className="border border-border px-3 py-1.5 text-center text-sm font-semibold text-primary">
                    {getMediana(dobra)} mm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Perimetria */}
      <Section title="Perimetria">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PERIMETRIA_COLS.map((col, ci) => (
            <div key={ci} className="space-y-3">
              {col.map((zona) => (
                <div key={zona} className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground w-36 shrink-0">{zona}</Label>
                  <Input
                    className="h-7 text-xs"
                    placeholder="0,00 mm"
                    value={form.perimetria?.[zona] ?? ""}
                    onChange={(e) => updatePerimetria(zona, e.target.value)}
                    readOnly={readOnly}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Grau de celulite */}
      <Section title="Grau de Celulite">
        <p className="text-xs text-muted-foreground">Aguardando fotos clínicas da ilustradora.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Grau 01", "Grau 02", "Grau 03", "Grau 04"].map((grau) => (
            <button
              key={grau}
              type="button"
              disabled={readOnly}
              onClick={() => update("celulite_grau", form.celulite_grau === grau ? "" : grau)}
              className="flex flex-col gap-2"
            >
              <div
                className={`w-full aspect-[3/4] rounded-lg border-2 bg-muted/30 flex items-center justify-center text-xs text-muted-foreground transition-colors ${form.celulite_grau === grau ? "border-primary/60 bg-primary/5" : "border-dashed border-border"}`}
              >
                Foto
              </div>
              <span className="text-xs text-center text-muted-foreground">{grau}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Estrias */}
      <Section title="Estrias">
        <p className="text-xs text-muted-foreground">Aguardando fotos clínicas da ilustradora.</p>
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          {["Rubra", "Alba"].map((tipo) => (
            <button
              key={tipo}
              type="button"
              disabled={readOnly}
              onClick={() => update("estrias_tipo", form.estrias_tipo === tipo ? "" : tipo)}
              className="flex flex-col gap-2"
            >
              <div
                className={`w-full aspect-square rounded-lg border-2 bg-muted/30 flex items-center justify-center text-xs text-muted-foreground transition-colors ${form.estrias_tipo === tipo ? "border-primary/60 bg-primary/5" : "border-dashed border-border"}`}
              >
                Foto
              </div>
              <span className="text-xs text-center text-muted-foreground">{tipo}</span>
            </button>
          ))}
        </div>
        <Field label="Observações">
          <Textarea value={form.estrias_obs} onChange={(e) => update("estrias_obs", e.target.value)} readOnly={readOnly} rows={2} />
        </Field>
      </Section>

      {/* Diástase */}
      <Section title="Teste de Diástase do Reto Abdominal">
        <p className="text-xs text-muted-foreground">Aguardando ilustrações da ilustradora.</p>
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          {["Negativo", "Positivo"].map((res) => (
            <button
              key={res}
              type="button"
              disabled={readOnly}
              onClick={() => update("diastase_teste", form.diastase_teste === res ? "" : res)}
              className="flex flex-col gap-2"
            >
              <IllustrationPlaceholder label={`Ilustração: diástase ${res.toLowerCase()}`} height={120} />
              <span className={`text-xs text-center font-medium ${form.diastase_teste === res ? "text-primary" : "text-muted-foreground"}`}>
                {res}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Tipo de Diástase
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Tipo A", "Tipo B", "Tipo C", "Tipo D"].map((tipo) => (
              <button
                key={tipo}
                type="button"
                disabled={readOnly}
                onClick={() => update("diastase_tipo", form.diastase_tipo === tipo ? "" : tipo)}
                className="flex flex-col gap-2"
              >
                <IllustrationPlaceholder label={`Ilustração: ${tipo}`} height={100} />
                <span className={`text-xs text-center font-medium ${form.diastase_tipo === tipo ? "text-primary" : "text-muted-foreground"}`}>
                  {tipo}
                </span>
              </button>
            ))}
          </div>
        </div>
        <Field label="Observações">
          <Textarea value={form.diastase_obs} onChange={(e) => update("diastase_obs", e.target.value)} readOnly={readOnly} rows={2} />
        </Field>
      </Section>

      {/* Aparência */}
      <Section title="Aparência Percebida">
        <p className="text-xs text-muted-foreground mb-2">
          Aguardando ilustrações de silhuetas corporais da ilustradora.
        </p>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => update("aparencia_percebida", String(n))}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`w-full aspect-[1/2.5] rounded-lg border-2 bg-muted/30 flex items-center justify-center text-[10px] text-muted-foreground transition-colors ${form.aparencia_percebida === String(n) ? "border-primary/60 bg-primary/5" : "border-dashed border-border"}`}
              >
                {n}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Selecione a silhueta que melhor representa como a cliente se vê.</p>
      </Section>

      <Section title="Aparência Desejada">
        <p className="text-xs text-muted-foreground mb-2">
          Aguardando ilustrações de silhuetas corporais da ilustradora.
        </p>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => update("aparencia_desejada", String(n))}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`w-full aspect-[1/2.5] rounded-lg border-2 bg-muted/30 flex items-center justify-center text-[10px] text-muted-foreground transition-colors ${form.aparencia_desejada === String(n) ? "border-primary/60 bg-primary/5" : "border-dashed border-border"}`}
              >
                {n}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Selecione a silhueta que representa o objetivo da cliente.</p>
      </Section>

      <Section title="Observações Gerais">
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

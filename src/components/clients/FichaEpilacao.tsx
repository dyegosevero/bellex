import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const FITZPATRICK = [
  { tipo: "I", cor: "#F7E8D4", label: "Tipo 1" },
  { tipo: "II", cor: "#EDD4AE", label: "Tipo 2" },
  { tipo: "III", cor: "#D4A574", label: "Tipo 3" },
  { tipo: "IV", cor: "#A0714F", label: "Tipo 4" },
  { tipo: "V", cor: "#6B4A2E", label: "Tipo 5" },
  { tipo: "VI", cor: "#3A2215", label: "Tipo 6" },
];

const INITIAL: Record<string, any> = {
  fototipo: "",
  pigmento_pelo: "",
  espessura_pelo: "",
  frequencia_epilacao: "",
  observacoes: "",
};

interface Props {
  readOnly?: boolean;
  defaultValues?: Record<string, any>;
  onChange?: (data: Record<string, any>) => void;
}

export const FichaEpilacao = ({ readOnly = false, defaultValues, onChange }: Props) => {
  const [form, setForm] = useState<Record<string, any>>(() => ({ ...INITIAL, ...defaultValues }));

  useEffect(() => { onChange?.(form); }, [form, onChange]);

  const update = (key: string, value: any) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold tracking-wider uppercase">Ficha de Epilação</h2>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary border-b border-border pb-2">
          Escala de Fitzpatrick
        </h3>
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
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Pigmento do pelo</Label>
          <Input
            value={form.pigmento_pelo}
            onChange={(e) => update("pigmento_pelo", e.target.value)}
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Espessura do pelo</Label>
          <Input
            value={form.espessura_pelo}
            onChange={(e) => update("espessura_pelo", e.target.value)}
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Frequência que realiza epilação
          </Label>
          <Input
            value={form.frequencia_epilacao}
            onChange={(e) => update("frequencia_epilacao", e.target.value)}
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Observações</Label>
          <Textarea
            value={form.observacoes}
            onChange={(e) => update("observacoes", e.target.value)}
            readOnly={readOnly}
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};

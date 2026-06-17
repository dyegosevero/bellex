import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

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

const PRODUTOS = ["Toxina botulínica", "Ácido hialurônico", "Fio de PDO"];

const INITIAL: Record<string, any> = {
  produtos: [] as string[],
  exibir_quantidades: false,
  marca: "",
  numero_lote: "",
  data_diluicao: "",
  volume_diluicao: "",
  data_validade: "",
  relatorio: "",
};

interface Props {
  readOnly?: boolean;
  defaultValues?: Record<string, any>;
  onChange?: (data: Record<string, any>) => void;
}

export const FichaInjetaveis = ({ readOnly = false, defaultValues, onChange }: Props) => {
  const [form, setForm] = useState<Record<string, any>>(() => ({
    ...INITIAL,
    produtos: [],
    ...defaultValues,
  }));

  useEffect(() => { onChange?.(form); }, [form, onChange]);

  const update = (key: string, value: any) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleProduto = (prod: string) => {
    if (readOnly) return;
    const cur: string[] = form.produtos ?? [];
    update("produtos", cur.includes(prod) ? cur.filter((p) => p !== prod) : [...cur, prod]);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold tracking-wider uppercase">Ficha de Injetáveis (Facial)</h2>
      </div>

      {/* Mapa facial */}
      <Section title="Mapa Facial">
        <p className="text-xs text-muted-foreground mb-3">
          Aguardando ilustração do mapa facial da ilustradora.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["Vista frontal", "Vista 3/4", "Vista perfil"].map((vista) => (
            <div key={vista} className="flex flex-col items-center gap-2">
              <div className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground text-center px-4">
                Ilustração: {vista}
              </div>
              <span className="text-xs text-muted-foreground">{vista}</span>
            </div>
          ))}
        </div>

        {/* Produtos */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Produtos utilizados</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Exibir quantidades</span>
              <Switch
                checked={form.exibir_quantidades}
                onCheckedChange={(v) => update("exibir_quantidades", v)}
                disabled={readOnly}
              />
            </div>
          </div>
          <div className="space-y-2">
            {PRODUTOS.map((prod) => (
              <label key={prod} className="flex items-center gap-3 text-sm cursor-pointer">
                <Checkbox
                  checked={(form.produtos ?? []).includes(prod)}
                  onCheckedChange={() => toggleProduto(prod)}
                  disabled={readOnly}
                />
                <span>{prod}</span>
                {form.exibir_quantidades && (form.produtos ?? []).includes(prod) && (
                  <Input
                    className="h-7 w-24 text-xs ml-2"
                    placeholder="Qtd / ml"
                    value={form[`qtd_${prod}`] ?? ""}
                    onChange={(e) => update(`qtd_${prod}`, e.target.value)}
                    readOnly={readOnly}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* Dados do produto */}
      <Section title="Dados do Produto">
        <div className="space-y-4">
          <Field label="Marca">
            <Input value={form.marca} onChange={(e) => update("marca", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Número do lote">
            <Input value={form.numero_lote} onChange={(e) => update("numero_lote", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Data de diluição">
            <Input
              type="date"
              value={form.data_diluicao}
              onChange={(e) => update("data_diluicao", e.target.value)}
              readOnly={readOnly}
            />
          </Field>
          <Field label="Volume de diluição">
            <Input value={form.volume_diluicao} onChange={(e) => update("volume_diluicao", e.target.value)} readOnly={readOnly} placeholder="ex: 2,5 ml" />
          </Field>
          <Field label="Data de validade">
            <Input
              type="date"
              value={form.data_validade}
              onChange={(e) => update("data_validade", e.target.value)}
              readOnly={readOnly}
            />
          </Field>
        </div>
      </Section>

      {/* Relatório */}
      <Section title="Relatório">
        <Textarea
          value={form.relatorio}
          onChange={(e) => update("relatorio", e.target.value)}
          readOnly={readOnly}
          rows={5}
          placeholder="Descreva o procedimento, pontos de aplicação, unidades utilizadas..."
        />
      </Section>
    </div>
  );
};

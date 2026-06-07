import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ProductSuggestionSelect } from "./ProductSuggestionSelect";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold uppercase tracking-wider text-primary border-b border-border pb-2">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
    {children}
  </div>
);

const CheckList = ({ options, values, onChange }: { options: string[]; values: string[]; onChange: (v: string[]) => void }) => (
  <div className="flex flex-wrap gap-3">
    {options.map((opt) => (
      <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox
          checked={values.includes(opt)}
          onCheckedChange={(checked) =>
            onChange(checked ? [...values, opt] : values.filter((v) => v !== opt))
          }
        />
        {opt}
      </label>
    ))}
  </div>
);

interface FaceFormData {
  [key: string]: any;
}

const INITIAL_STATE: FaceFormData = {
  viaja_muito: "",
  contacto_preferido: "",
  como_conheceu: "",
  queixa_principal: "",
  preocupacao_pele: [] as string[],
  preocupacao_outro: "",
  tempo_condicao: "",
  tratamento_anterior: "",
  tratamento_anterior_quais: "",
  tratamento_anterior_tempo: "",
  tratamento_anterior_onde: "",
  tratamento_anterior_resultados: "",
  reacao_adversa: "",
  historico_clinico: [] as string[],
  historico_clinico_outro: "",
  medicacao: [] as string[],
  medicacao_quais: "",
  medicacao_tempo: "",
  suplementos: "",
  suplementos_quais: "",
  ciclo_menstrual: "",
  acne_periodo: "",
  melasma_gravidez: "",
  gravida_amamentar: "",
  menopausa: "",
  menopausa_tempo: "",
  menopausa_sintomas: "",
  reposicao_hormonal: "",
  alergia: [] as string[],
  reacao_peeling: "",
  qual_reacao: "",
  cicatrizacao: "",
  fuma: "",
  cigarros_dia: "",
  fuma_tempo: "",
  alcool: "",
  tipo_bebida: "",
  funcionamento_intestinal: "",
  sono_horas: "",
  sono_qualidade: "",
  stress: "",
  stress_causa: "",
  atividade_fisica: "",
  atividade_tipo: "",
  proteses: "",
  lentes: "",
  exposicao_temperatura: "",
  solario: "",
  alimentacao: [] as string[],
  agua_diaria: "",
  exposicao_solar: "",
  queimaduras_solares: "",
  protetor_solar: "",
  fps_habitual: "",
  reaplica_protetor: "",
  produto_limpeza: "",
  hidratante: "",
  serum: "",
  retinol_acidos: "",
  protetor_solar_produto: "",
  maquilhagem: "",
  produtos_tempo: "",
  produtos_prescreveu: "",
  forma_aplicacao: "",
  nome_tratamento: "",
  fototipo: "",
  tipo_pele: "",
  espessura: "",
  textura: "",
  descamacao: "",
  poros_dilatados: "",
  poros_entupidos: "",
  barreira_cutanea: "",
  hiperpigmentacao: [] as string[],
  tom_pele: "",
  profundidade_estimada: "",
  desidratacao_presente: "",
  desidratacao_grau: "",
  brilho: "",
  inflamacao_presente: "",
  inflamacao_eritema: "",
  inflamacao_localizacao: "",
  acne_classificacao: "",
  acne_presenca: [] as string[],
  rosacea: [] as string[],
  telangiectasias: "",
  glogau: "",
  envelhecimento_predominancia: [] as string[],
  flacidez: "",
  observacoes_clinicas: "",
  plano_objetivo: "",
  plano_protocolo: "",
  plano_sessoes: "",
  plano_intervalo: "",
  plano_produtos_sugeridos: [] as { id: string; name: string }[],
  plano_homecare: "",
};

interface Props {
  readOnly?: boolean;
  defaultValues?: Record<string, any>;
  placeholderData?: Record<string, any>;
  onChange?: (data: Record<string, any>) => void;
}

export const AnamnesisFaceForm = ({ readOnly = false, defaultValues, placeholderData, onChange }: Props) => {
  const [form, setForm] = useState<FaceFormData>(() => {
    if (defaultValues) {
      const merged = { ...INITIAL_STATE };
      for (const [k, v] of Object.entries(defaultValues)) {
        if (k in merged) merged[k] = v;
      }
      return merged;
    }
    return { ...INITIAL_STATE };
  });

  useEffect(() => {
    onChange?.(form);
  }, [form, onChange]);

  const update = (key: string, value: any) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const ph = (key: string) => placeholderData?.[key] ?? undefined;

  return (
    <div className="space-y-8">
      {/* PARTE I – ANAMNESE */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold tracking-wider uppercase">Ficha de Anamnese – Rosto</h2>
        <p className="text-xs text-muted-foreground mt-1">Preencha todos os campos aplicáveis</p>
      </div>

      {/* 1. DADOS PESSOAIS */}
      <Section title="1. Dados Complementares">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Viaja muito?">
            <RadioGroup value={form.viaja_muito} onValueChange={(v) => update("viaja_muito", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Como prefere ser contactado?">
            <Select value={form.contacto_preferido} onValueChange={(v) => update("contacto_preferido", v)} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sms_tlf">SMS / Telefone</SelectItem>
                <SelectItem value="redes_sociais">Redes Sociais</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Como conheceu a clínica">
            <Input value={form.como_conheceu} onChange={(e) => update("como_conheceu", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* 2. MOTIVO DA CONSULTA */}
      <Section title="2. Motivo da Consulta">
        <div className="space-y-4">
          <Field label="Queixa principal" full>
            <Textarea value={form.queixa_principal} onChange={(e) => update("queixa_principal", e.target.value)} readOnly={readOnly} rows={2} />
          </Field>
          <Field label="Qual é a sua principal preocupação com a pele?" full>
            <CheckList
              options={["Acne", "Manchas / Melasma", "Rosácea", "Sensibilidade", "Rugas", "Flacidez", "Oleosidade"]}
              values={form.preocupacao_pele}
              onChange={(v) => update("preocupacao_pele", v)}
            />
            <Input placeholder="Outro..." className="mt-2" value={form.preocupacao_outro} onChange={(e) => update("preocupacao_outro", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Há quanto tempo apresenta esta condição?">
            <Input value={form.tempo_condicao} onChange={(e) => update("tempo_condicao", e.target.value)} readOnly={readOnly} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tratamento anterior?">
              <Input value={form.tratamento_anterior} onChange={(e) => update("tratamento_anterior", e.target.value)} readOnly={readOnly} />
            </Field>
            <Field label="Quais?">
              <Input value={form.tratamento_anterior_quais} onChange={(e) => update("tratamento_anterior_quais", e.target.value)} readOnly={readOnly} />
            </Field>
            <Field label="Há quanto tempo?">
              <Input value={form.tratamento_anterior_tempo} onChange={(e) => update("tratamento_anterior_tempo", e.target.value)} readOnly={readOnly} />
            </Field>
            <Field label="Onde ou com quem foi realizado?">
              <Input value={form.tratamento_anterior_onde} onChange={(e) => update("tratamento_anterior_onde", e.target.value)} readOnly={readOnly} />
            </Field>
            <Field label="Resultados?">
              <Input value={form.tratamento_anterior_resultados} onChange={(e) => update("tratamento_anterior_resultados", e.target.value)} readOnly={readOnly} />
            </Field>
            <Field label="Reação adversa?">
              <Input value={form.reacao_adversa} onChange={(e) => update("reacao_adversa", e.target.value)} readOnly={readOnly} />
            </Field>
          </div>
        </div>
      </Section>

      {/* 3. HISTÓRICO CLÍNICO */}
      <Section title="3. Histórico Clínico">
        <Field label="Tem ou já teve:" full>
          <CheckList
            options={["Hipertensão", "Diabetes", "Problemas da tiróide", "SOP", "Doenças autoimunes", "Doença hepática", "Doença renal", "Cancro", "Ansiedade / Depressão", "Problemas circulatórios"]}
            values={form.historico_clinico}
            onChange={(v) => update("historico_clinico", v)}
          />
          <Input placeholder="Outro..." className="mt-2" value={form.historico_clinico_outro} onChange={(e) => update("historico_clinico_outro", e.target.value)} readOnly={readOnly} />
        </Field>
      </Section>

      {/* 4. MEDICAÇÃO ATUAL */}
      <Section title="4. Medicação Atual">
        <Field label="Medicação" full>
          <CheckList
            options={["Anticoncecional", "Terapia hormonal", "Antidepressivos / Ansiolíticos", "Anticoagulantes", "Corticoides", "Isotretinoína", "Antibióticos recentes", "Anti inflamatórios"]}
            values={form.medicacao}
            onChange={(v) => update("medicacao", v)}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Qual(is)?">
            <Input value={form.medicacao_quais} onChange={(e) => update("medicacao_quais", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Há quanto tempo?">
            <Input value={form.medicacao_tempo} onChange={(e) => update("medicacao_tempo", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* 5. SUPLEMENTAÇÃO */}
      <Section title="5. Suplementação">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Toma suplementos?">
            <RadioGroup value={form.suplementos} onValueChange={(v) => update("suplementos", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Quais?">
            <Input value={form.suplementos_quais} onChange={(e) => update("suplementos_quais", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* 6. HISTÓRICO HORMONAL */}
      <Section title="6. Histórico Hormonal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Ciclo menstrual">
            <RadioGroup value={form.ciclo_menstrual} onValueChange={(v) => update("ciclo_menstrual", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="regular" /> Regular</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="irregular" /> Irregular</label>
            </RadioGroup>
          </Field>
          <Field label="Acne relacionada com o período?">
            <RadioGroup value={form.acne_periodo} onValueChange={(v) => update("acne_periodo", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Melasma surgiu após gravidez ou anticoncecional?">
            <RadioGroup value={form.melasma_gravidez} onValueChange={(v) => update("melasma_gravidez", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Grávida ou a amamentar?">
            <Input value={form.gravida_amamentar} onChange={(e) => update("gravida_amamentar", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Menopausa?">
            <RadioGroup value={form.menopausa} onValueChange={(v) => update("menopausa", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Há quanto tempo?">
            <Input value={form.menopausa_tempo} onChange={(e) => update("menopausa_tempo", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Sintomas?">
            <Input value={form.menopausa_sintomas} onChange={(e) => update("menopausa_sintomas", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Reposição hormonal?">
            <Input value={form.reposicao_hormonal} onChange={(e) => update("reposicao_hormonal", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* 7. ALERGIAS E REAÇÕES */}
      <Section title="7. Alergias e Reações">
        <Field label="Tem alergia a:" full>
          <CheckList
            options={["Cosméticos", "Medicamentos", "Alimentos"]}
            values={form.alergia}
            onChange={(v) => update("alergia", v)}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Reação a peeling ou tratamento facial?">
            <Input value={form.reacao_peeling} onChange={(e) => update("reacao_peeling", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Qual foi a reação?">
            <Input value={form.qual_reacao} onChange={(e) => update("qual_reacao", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Como cicatriza?">
            <RadioGroup value={form.cicatrizacao} onValueChange={(v) => update("cicatrizacao", v)} className="flex flex-wrap gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="normal" /> Normal</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="mancha_escura" /> Mancha escura</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="cicatriz_elevada" /> Cicatriz elevada</label>
            </RadioGroup>
          </Field>
        </div>
      </Section>

      {/* 8. HÁBITOS E ESTILO DE VIDA */}
      <Section title="8. Hábitos e Estilo de Vida">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Fuma?">
            <RadioGroup value={form.fuma} onValueChange={(v) => update("fuma", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          {form.fuma === "sim" && (
            <>
              <Field label="Nº cigarros/dia">
                <Input value={form.cigarros_dia} onChange={(e) => update("cigarros_dia", e.target.value)} readOnly={readOnly} />
              </Field>
              <Field label="Há quanto tempo?">
                <Input value={form.fuma_tempo} onChange={(e) => update("fuma_tempo", e.target.value)} readOnly={readOnly} />
              </Field>
            </>
          )}
          <Field label="Consumo de Álcool">
            <RadioGroup value={form.alcool} onValueChange={(v) => update("alcool", v)} className="flex flex-wrap gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="ocasional" /> Ocasional</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="semanal" /> Semanal</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="frequente" /> Frequente</label>
            </RadioGroup>
          </Field>
          <Field label="Tipo de bebida">
            <Input value={form.tipo_bebida} onChange={(e) => update("tipo_bebida", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Funcionamento intestinal">
            <Input value={form.funcionamento_intestinal} onChange={(e) => update("funcionamento_intestinal", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Horas de sono por noite">
            <Input value={form.sono_horas} onChange={(e) => update("sono_horas", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Qualidade do sono">
            <RadioGroup value={form.sono_qualidade} onValueChange={(v) => update("sono_qualidade", v)} className="flex flex-wrap gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="boa" /> Boa</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="interrompida" /> Interrompida</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="insonia" /> Insónia</label>
            </RadioGroup>
          </Field>
          <Field label="Nível de Stress">
            <RadioGroup value={form.stress} onValueChange={(v) => update("stress", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="baixo" /> Baixo</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="moderado" /> Moderado</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="elevado" /> Elevado</label>
            </RadioGroup>
          </Field>
          <Field label="Principal causa de stress">
            <RadioGroup value={form.stress_causa} onValueChange={(v) => update("stress_causa", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="trabalho" /> Trabalho</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="familia" /> Família</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="ambos" /> Ambos</label>
            </RadioGroup>
          </Field>
          <Field label="Atividade Física">
            <RadioGroup value={form.atividade_fisica} onValueChange={(v) => update("atividade_fisica", v)} className="flex flex-wrap gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao_pratica" /> Não pratica</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="1_2x" /> 1–2x/sem</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="3_4x" /> 3–4x/sem</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="mais_4x" /> &gt;4x/sem</label>
            </RadioGroup>
          </Field>
          <Field label="Tipo de atividade">
            <Input value={form.atividade_tipo} onChange={(e) => update("atividade_tipo", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Próteses? (metálicas, implantes, pacemaker, DIU)">
            <Input value={form.proteses} onChange={(e) => update("proteses", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Lentes?">
            <Input value={form.lentes} onChange={(e) => update("lentes", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Exposição a temperaturas elevadas (sauna, banho turco)">
            <Input value={form.exposicao_temperatura} onChange={(e) => update("exposicao_temperatura", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Solário?">
            <Input value={form.solario} onChange={(e) => update("solario", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
        <Field label="Alimentação – Consome frequentemente:" full>
          <CheckList
            options={["Açúcares", "Lacticínios", "Fritos / gorduras", "Picantes", "Processados"]}
            values={form.alimentacao}
            onChange={(v) => update("alimentacao", v)}
          />
        </Field>
        <Field label="Ingestão diária de água">
          <Input value={form.agua_diaria} onChange={(e) => update("agua_diaria", e.target.value)} readOnly={readOnly} placeholder="ex: 1.5L" />
        </Field>
      </Section>

      {/* 9. EXPOSIÇÃO SOLAR */}
      <Section title="9. Exposição Solar">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Exposição frequente ao sol?">
            <RadioGroup value={form.exposicao_solar} onValueChange={(v) => update("exposicao_solar", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Já teve queimaduras solares?">
            <RadioGroup value={form.queimaduras_solares} onValueChange={(v) => update("queimaduras_solares", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Usa protetor solar diariamente?">
            <RadioGroup value={form.protetor_solar} onValueChange={(v) => update("protetor_solar", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="FPS habitual">
            <Input value={form.fps_habitual} onChange={(e) => update("fps_habitual", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Reaplica durante o dia?">
            <Input value={form.reaplica_protetor} onChange={(e) => update("reaplica_protetor", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* 10. ROTINA DE CUIDADOS FACIAIS */}
      <Section title="10. Rotina de Cuidados Faciais">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Produto de limpeza">
            <Input value={form.produto_limpeza} onChange={(e) => update("produto_limpeza", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Hidratante">
            <Input value={form.hidratante} onChange={(e) => update("hidratante", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Sérum">
            <Input value={form.serum} onChange={(e) => update("serum", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Usa retinol ou ácidos?">
            <Input value={form.retinol_acidos} onChange={(e) => update("retinol_acidos", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Protetor solar (produto)">
            <Input value={form.protetor_solar_produto} onChange={(e) => update("protetor_solar_produto", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Usa maquilhagem?">
            <Input value={form.maquilhagem} onChange={(e) => update("maquilhagem", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Há quanto tempo utiliza estes produtos?">
            <Input value={form.produtos_tempo} onChange={(e) => update("produtos_tempo", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Quem prescreveu?">
            <Input value={form.produtos_prescreveu} onChange={(e) => update("produtos_prescreveu", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Forma de aplicação" full>
            <Input value={form.forma_aplicacao} onChange={(e) => update("forma_aplicacao", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      <Separator />

      {/* PARTE II – AVALIAÇÃO PROFISSIONAL */}
      <div className="text-center">
        <h2 className="text-lg font-semibold tracking-wider uppercase">Parte II – Avaliação Profissional</h2>
      </div>

      <Section title="Dados da Avaliação">
        <Field label="Nome de tratamento" full>
          <Input value={form.nome_tratamento} onChange={(e) => update("nome_tratamento", e.target.value)} readOnly={readOnly} />
        </Field>
      </Section>

      <Section title="1. Fototipo Cutâneo (Fitzpatrick)">
        <RadioGroup value={form.fototipo} onValueChange={(v) => update("fototipo", v)} className="flex flex-wrap gap-4" disabled={readOnly}>
          {["I", "II", "III", "IV", "V", "VI"].map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm"><RadioGroupItem value={f} /> {f}</label>
          ))}
        </RadioGroup>
      </Section>

      <Section title="2. Tipo de Pele">
        <RadioGroup value={form.tipo_pele} onValueChange={(v) => update("tipo_pele", v)} className="flex flex-wrap gap-4" disabled={readOnly}>
          {["Seca", "Mista", "Oleosa", "Sensível", "Acneica"].map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm"><RadioGroupItem value={t} /> {t}</label>
          ))}
        </RadioGroup>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Field label="Espessura">
            <RadioGroup value={form.espessura} onValueChange={(v) => update("espessura", v)} className="flex gap-4" disabled={readOnly}>
              {["Fina", "Média", "Espessa"].map((e) => (
                <label key={e} className="flex items-center gap-2 text-sm"><RadioGroupItem value={e} /> {e}</label>
              ))}
            </RadioGroup>
          </Field>
          <Field label="Textura da pele">
            <RadioGroup value={form.textura} onValueChange={(v) => update("textura", v)} className="flex gap-4" disabled={readOnly}>
              {["Suave", "Áspera", "Irregular"].map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm"><RadioGroupItem value={t} /> {t}</label>
              ))}
            </RadioGroup>
          </Field>
          <Field label="Descamação">
            <RadioGroup value={form.descamacao} onValueChange={(v) => update("descamacao", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Poros">
            <RadioGroup value={form.poros_dilatados} onValueChange={(v) => update("poros_dilatados", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="dilatados" /> Dilatados</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao_dilatados" /> Não dilatados</label>
            </RadioGroup>
          </Field>
          <Field label="Poros entupidos?">
            <RadioGroup value={form.poros_entupidos} onValueChange={(v) => update("poros_entupidos", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
        </div>
      </Section>

      <Section title="3. Barreira Cutânea">
        <RadioGroup value={form.barreira_cutanea} onValueChange={(v) => update("barreira_cutanea", v)} className="flex flex-wrap gap-4" disabled={readOnly}>
          {["Preservada", "Comprometida", "Sensibilizada", "Inflamação subclínica"].map((b) => (
            <label key={b} className="flex items-center gap-2 text-sm"><RadioGroupItem value={b} /> {b}</label>
          ))}
        </RadioGroup>
      </Section>

      <Section title="4. Hiperpigmentação">
        <CheckList
          options={["Melasma centrofacial", "Melasma malar", "Melasma mandibular", "Lêntigos solares", "Hiperpigmentação pós-inflamatória"]}
          values={form.hiperpigmentacao}
          onChange={(v) => update("hiperpigmentacao", v)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Tom de pele">
            <RadioGroup value={form.tom_pele} onValueChange={(v) => update("tom_pele", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="uniforme" /> Uniforme</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="irregular" /> Irregular</label>
            </RadioGroup>
          </Field>
          <Field label="Profundidade estimada">
            <RadioGroup value={form.profundidade_estimada} onValueChange={(v) => update("profundidade_estimada", v)} className="flex gap-4" disabled={readOnly}>
              {["Epidérmica", "Dérmica", "Mista"].map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm"><RadioGroupItem value={p} /> {p}</label>
              ))}
            </RadioGroup>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Desidratação">
            <RadioGroup value={form.desidratacao_presente} onValueChange={(v) => update("desidratacao_presente", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="presente" /> Presente</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="ausente" /> Ausente</label>
            </RadioGroup>
          </Field>
          {form.desidratacao_presente === "presente" && (
            <Field label="Grau">
              <RadioGroup value={form.desidratacao_grau} onValueChange={(v) => update("desidratacao_grau", v)} className="flex gap-4" disabled={readOnly}>
                {["Leve", "Moderado", "Severo"].map((g) => (
                  <label key={g} className="flex items-center gap-2 text-sm"><RadioGroupItem value={g} /> {g}</label>
                ))}
              </RadioGroup>
            </Field>
          )}
          <Field label="Brilho">
            <RadioGroup value={form.brilho} onValueChange={(v) => update("brilho", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="mate" /> Mate</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="oleosa" /> Oleosa</label>
            </RadioGroup>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Inflamação">
            <RadioGroup value={form.inflamacao_presente} onValueChange={(v) => update("inflamacao_presente", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="presente" /> Presente</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="ausente" /> Ausente</label>
            </RadioGroup>
          </Field>
          <Field label="Eritema">
            <Input value={form.inflamacao_eritema} onChange={(e) => update("inflamacao_eritema", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Localização">
            <Input value={form.inflamacao_localizacao} onChange={(e) => update("inflamacao_localizacao", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      <Section title="5. Acne – Classificação">
        <RadioGroup value={form.acne_classificacao} onValueChange={(v) => update("acne_classificacao", v)} className="flex flex-wrap gap-4" disabled={readOnly}>
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="I" /> Grau I – Comedónica</label>
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="II" /> Grau II – Pápulo-pustulosa</label>
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="III" /> Grau III – Nódulo-quística</label>
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="IV" /> Grau IV – Conglobata</label>
        </RadioGroup>
        <Field label="Presença de:" full>
          <CheckList
            options={["Cicatrizes", "PIH", "Seborreia intensa"]}
            values={form.acne_presenca}
            onChange={(v) => update("acne_presenca", v)}
          />
        </Field>
      </Section>

      <Section title="6. Rosácea">
        <CheckList
          options={["Eritemato-telangiectásica", "Pápulo-pustulosa", "Fimatosa"]}
          values={form.rosacea}
          onChange={(v) => update("rosacea", v)}
        />
        <Field label="Telangiectasias visíveis?">
          <RadioGroup value={form.telangiectasias} onValueChange={(v) => update("telangiectasias", v)} className="flex gap-4" disabled={readOnly}>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
          </RadioGroup>
        </Field>
      </Section>

      <Section title="7. Envelhecimento Cutâneo">
        <Field label="Classificação Glogau" full>
          <RadioGroup value={form.glogau} onValueChange={(v) => update("glogau", v)} className="flex flex-wrap gap-4" disabled={readOnly}>
            {["I", "II", "III", "IV"].map((g) => (
              <label key={g} className="flex items-center gap-2 text-sm"><RadioGroupItem value={g} /> Tipo {g}</label>
            ))}
          </RadioGroup>
        </Field>
        <Field label="Predominância" full>
          <CheckList
            options={["Fotoenvelhecimento", "Cronológico", "Hormonal", "Inflamatório"]}
            values={form.envelhecimento_predominancia}
            onChange={(v) => update("envelhecimento_predominancia", v)}
          />
        </Field>
        <Field label="Flacidez">
          <RadioGroup value={form.flacidez} onValueChange={(v) => update("flacidez", v)} className="flex gap-4" disabled={readOnly}>
            {["Leve", "Moderada", "Severa"].map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm"><RadioGroupItem value={f} /> {f}</label>
            ))}
          </RadioGroup>
        </Field>
      </Section>

      <Section title="8. Observações Clínicas *">
        <Textarea
          value={form.observacoes_clinicas}
          onChange={(e) => update("observacoes_clinicas", e.target.value)}
          readOnly={readOnly}
          rows={4}
          placeholder={ph("observacoes_clinicas") || "Observações do profissional..."}
        />
      </Section>

      <Section title="9. Plano Terapêutico *">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Objetivo principal *" full>
            <Input
              value={form.plano_objetivo}
              onChange={(e) => update("plano_objetivo", e.target.value)}
              readOnly={readOnly}
              placeholder={ph("plano_objetivo") || ""}
            />
          </Field>
          <Field label="Protocolo em cabine *" full>
            <Textarea
              value={form.plano_protocolo}
              onChange={(e) => update("plano_protocolo", e.target.value)}
              readOnly={readOnly}
              rows={2}
              placeholder={ph("plano_protocolo") || ""}
            />
          </Field>
          <div className="flex gap-4 items-end">
            <div className="w-40 shrink-0">
              <Field label="Nº de sessões *">
                <Input
                  value={form.plano_sessoes}
                  onChange={(e) => update("plano_sessoes", e.target.value)}
                  readOnly={readOnly}
                  placeholder={ph("plano_sessoes") || ""}
                />
              </Field>
            </div>
            <div className="w-40 shrink-0">
              <Field label="Intervalo *">
                <Input
                  value={form.plano_intervalo}
                  onChange={(e) => update("plano_intervalo", e.target.value)}
                  readOnly={readOnly}
                  placeholder={ph("plano_intervalo") || ""}
                />
              </Field>
            </div>
            <div className="flex-1 min-w-0">
              <Field label="Produtos recomendados">
                <ProductSuggestionSelect
                  value={form.plano_produtos_sugeridos ?? []}
                  onChange={(v) => update("plano_produtos_sugeridos", v)}
                  readOnly={readOnly}
                />
              </Field>
            </div>
          </div>
          <Field label="Home care recomendado *" full>
            <Textarea
              value={form.plano_homecare}
              onChange={(e) => update("plano_homecare", e.target.value)}
              readOnly={readOnly}
              rows={2}
              placeholder={ph("plano_homecare") || ""}
            />
          </Field>
        </div>
      </Section>
    </div>
  );
};

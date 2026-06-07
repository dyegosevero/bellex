import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BodyDiagram } from "./BodyDiagram";
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
const BODY_ZONES = [
  { key: "braco_dir", label: "Braço direito", num: 1 },
  { key: "braco_esq", label: "Braço esquerdo", num: 2 },
  { key: "cintura", label: "Cintura", num: 3 },
  { key: "abdomen", label: "Abdómen, barriga", num: 4 },
  { key: "coxa_dir", label: "Coxa direita", num: 5 },
  { key: "coxa_esq", label: "Coxa esquerda", num: 6 },
  { key: "joelho_dir", label: "Joelho direito", num: 7 },
  { key: "joelho_esq", label: "Joelho esquerdo", num: 8 },
  { key: "tornozelo_dir", label: "Tornozelo direito", num: 9 },
  { key: "tornozelo_esq", label: "Tornozelo esquerdo", num: 10 },
];

const INITIAL_STATE: Record<string, any> = {
  objetivo_visita: "",
  quando_surgiu: "",
  eventos_recentes: "",
  como_se_sente: "",
  resultados_quando: "",
  alimentacao: "",
  alimentacao_outro: "",
  refeicoes_dia: "",
  agua_chas: "",
  alcool: "",
  dieta_especial: "",
  tipo_sono: "",
  pratica_desporto: "",
  tabagismo: "",
  atividade_quotidiana: "",
  cintas_ligas: "",
  exposicao_solar: "",
  cuidados_pele: "",
  estado_emocional: "",
  estado_emocional_outro: "",
  gravida: "",
  disturbio_hormonal: "",
  disturbio_hormonal_qual: "",
  limitacao_tratamentos: "",
  limitacao_tratamentos_qual: "",
  problema_cardiaco: "",
  problema_cardiaco_qual: "",
  proteses_pacemaker: "",
  suplementos: "",
  suplementos_quais: "",
  suplementos_tempo: "",
  suplementos_prescritor: "",
  suplementos_alteracoes: "",
  doencas: [] as string[],
  tratamento_endocrino: "",
  tratamento_oncologico: "",
  antecedentes_cirurgicos: "",
  tipo_recuperacao: "",
  cicatrizacao: "",
  analises_frequencia: "",
  analises_resultados: "",
  problemas_circulatorios: [] as string[],
  problemas_circulatorios_quais: "",
  problemas_circulatorios_sintomas: "",
  problemas_circulatorios_tempo: "",
  problemas_circulatorios_origem: "",
  intervencionados: "",
  medicacao_suplementacao: "",
  meias_contencao: "",
  gravidez_atual_tempo: "",
  n_gravidezas: "",
  n_partos: "",
  tipo_partos: "",
  tempo_entre_partos: "",
  amamentacao: "",
  fertilidade: "",
  fertilidade_tratamentos: "",
  peso_gravidez: "",
  recuperacao_pos_parto: "",
  incontinencia: "",
  depressao_pos_parto: "",
  menopausa_tempo: "",
  menopausa_sintomas: "",
  reposicao_hormonal: "",
  dieta_nutricionista: "",
  dieta_tempo: "",
  funcionamento_intestinal: "",
  intestinal_forma: "",
  frequencia_urinaria: "",
  urinaria_quantidade: "",
  urinaria_cor: "",
  agua_cha_suplementos: "",
  ciclo_menstrual: "",
  metodo_anticoncecional: "",
  ciclo_abundancia: "",
  sintomas_pre_pos: "",
  ortopedica: "",
  horas_trabalho: "",
  turnos: "",
  tempo_sentado_pe: "",
  pausas_descanso: "",
  exposicao_solar_trabalho: "",
  ambiente: "",
  atividade_fisica_qual: "",
  atividade_fisica_tempo: "",
  atividade_fisica_frequencia: "",
  atividade_fisica_orientada: "",
  sono_horas: "",
  sono_qualidade: "",
  vestuario: "",
  vestuario_tecido: "",
  vestuario_tamanho: "",
  stress: "",
  intolerancia: "",
  metabolismo_hormonios: [] as string[],
  
  frequencia_tratamentos: "",
  gordura_localizacao: [] as string[],
  gordura_tipo: "",
  celulite_grau: "",
  celulite_tipo: "",
  flacidez_tipo: "",
  flacidez_localizacao: "",
  retencao_godet: "",
  retencao_sensacao: [] as string[],
  pos_parto_tempo: "",
  pos_parto_pele: [] as string[],
  pos_parto_muscular: "",
  plano_frequencia: "",
  plano_tecnicas: [] as string[],
  plano_sessoes: "",
  plano_produtos_sugeridos: [] as { id: string; name: string }[],
  plano_reavaliacao: "",
  orientacoes: [] as string[],
  observacoes: "",
  medidas: {} as Record<string, Record<string, string>>,
};

interface Props {
  readOnly?: boolean;
  defaultValues?: Record<string, any>;
  placeholderData?: Record<string, any>;
  onChange?: (data: Record<string, any>) => void;
}

export const AnamnesisBodyForm = ({ readOnly = false, defaultValues, placeholderData, onChange }: Props) => {
  const [activeZone, setActiveZone] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>(() => {
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
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold tracking-wider uppercase">Ficha de Anamnese – Corpo</h2>
        <p className="text-xs text-muted-foreground mt-1">Consulta de Diagnóstico Corporal</p>
      </div>

      {/* 1. OBJETIVO DA VISITA */}
      <Section title="1. Objetivo da Visita">
        <div className="space-y-4">
          <Field label="Objetivo da visita" full>
            <Textarea value={form.objetivo_visita} onChange={(e) => update("objetivo_visita", e.target.value)} readOnly={readOnly} rows={2} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Quando surgiu o problema?">
              <Input value={form.quando_surgiu} onChange={(e) => update("quando_surgiu", e.target.value)} readOnly={readOnly} />
            </Field>
            <Field label="Eventos recentes que podem ter influenciado">
              <Input value={form.eventos_recentes} onChange={(e) => update("eventos_recentes", e.target.value)} readOnly={readOnly} />
            </Field>
            <Field label="Como se sente atualmente?">
              <Input value={form.como_se_sente} onChange={(e) => update("como_se_sente", e.target.value)} readOnly={readOnly} />
            </Field>
            <Field label="Quando gostaria de ver os resultados?">
              <Input value={form.resultados_quando} onChange={(e) => update("resultados_quando", e.target.value)} readOnly={readOnly} />
            </Field>
          </div>
        </div>
      </Section>

      {/* 2. HÁBITOS */}
      <Section title="2. Hábitos e Estilo de Vida">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tipo de alimentação">
            <RadioGroup value={form.alimentacao} onValueChange={(v) => update("alimentacao", v)} className="flex flex-wrap gap-3" disabled={readOnly}>
              {["Equilibrada", "Rica em hidratos", "Rica em gorduras"].map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm"><RadioGroupItem value={a} /> {a}</label>
              ))}
            </RadioGroup>
            <Input placeholder="Outro..." className="mt-2" value={form.alimentacao_outro} onChange={(e) => update("alimentacao_outro", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Nº de refeições por dia">
            <Input value={form.refeicoes_dia} onChange={(e) => update("refeicoes_dia", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Ingestão de água/chás (L)">
            <Input value={form.agua_chas} onChange={(e) => update("agua_chas", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Álcool">
            <RadioGroup value={form.alcool} onValueChange={(v) => update("alcool", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Dieta alimentar especial">
            <RadioGroup value={form.dieta_especial} onValueChange={(v) => update("dieta_especial", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Tipo de sono">
            <RadioGroup value={form.tipo_sono} onValueChange={(v) => update("tipo_sono", v)} className="flex gap-4" disabled={readOnly}>
              {["Profundo", "Leve", "Interrompido"].map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm"><RadioGroupItem value={s} /> {s}</label>
              ))}
            </RadioGroup>
          </Field>
          <Field label="Prática de desporto">
            <RadioGroup value={form.pratica_desporto} onValueChange={(v) => update("pratica_desporto", v)} className="flex gap-4" disabled={readOnly}>
              {["Sedentária", "Moderada", "Intensa"].map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm"><RadioGroupItem value={p} /> {p}</label>
              ))}
            </RadioGroup>
          </Field>
          <Field label="Tabagismo">
            <RadioGroup value={form.tabagismo} onValueChange={(v) => update("tabagismo", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Atividade quotidiana">
            <RadioGroup value={form.atividade_quotidiana} onValueChange={(v) => update("atividade_quotidiana", v)} className="flex gap-4" disabled={readOnly}>
              {["Leve", "Moderada", "Intensa"].map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm"><RadioGroupItem value={a} /> {a}</label>
              ))}
            </RadioGroup>
          </Field>
          <Field label="Utiliza cintas, ligas ou meias com elásticos?">
            <RadioGroup value={form.cintas_ligas} onValueChange={(v) => update("cintas_ligas", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Exposição solar">
            <RadioGroup value={form.exposicao_solar} onValueChange={(v) => update("exposicao_solar", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Cuidados de pele">
            <RadioGroup value={form.cuidados_pele} onValueChange={(v) => update("cuidados_pele", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
        </div>
      </Section>

      {/* LIMITAÇÕES DE SAÚDE */}
      <Section title="Limitações de Saúde">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Estado emocional atual">
            <RadioGroup value={form.estado_emocional} onValueChange={(v) => update("estado_emocional", v)} className="flex flex-wrap gap-3" disabled={readOnly}>
              {["Bom", "Regular", "Stress", "Ansiedade"].map((e) => (
                <label key={e} className="flex items-center gap-2 text-sm"><RadioGroupItem value={e} /> {e}</label>
              ))}
            </RadioGroup>
            <Input placeholder="Outro..." className="mt-2" value={form.estado_emocional_outro} onChange={(e) => update("estado_emocional_outro", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Pode estar grávida?">
            <RadioGroup value={form.gravida} onValueChange={(v) => update("gravida", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
          </Field>
          <Field label="Distúrbio hormonal?">
            <RadioGroup value={form.disturbio_hormonal} onValueChange={(v) => update("disturbio_hormonal", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
            {form.disturbio_hormonal === "sim" && (
              <Input placeholder="Qual?" className="mt-2" value={form.disturbio_hormonal_qual} onChange={(e) => update("disturbio_hormonal_qual", e.target.value)} readOnly={readOnly} />
            )}
          </Field>
          <Field label="Limitação para tratamentos eletroestéticos?">
            <RadioGroup value={form.limitacao_tratamentos} onValueChange={(v) => update("limitacao_tratamentos", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
            {form.limitacao_tratamentos === "sim" && (
              <Input placeholder="Qual?" className="mt-2" value={form.limitacao_tratamentos_qual} onChange={(e) => update("limitacao_tratamentos_qual", e.target.value)} readOnly={readOnly} />
            )}
          </Field>
          <Field label="Problema cardíaco, pressão ou sistema digestivo?">
            <RadioGroup value={form.problema_cardiaco} onValueChange={(v) => update("problema_cardiaco", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
            </RadioGroup>
            {form.problema_cardiaco === "sim" && (
              <Input placeholder="Qual?" className="mt-2" value={form.problema_cardiaco_qual} onChange={(e) => update("problema_cardiaco_qual", e.target.value)} readOnly={readOnly} />
            )}
          </Field>
          <Field label="Pacemaker? DIU? Próteses metálicas?">
            <Input value={form.proteses_pacemaker} onChange={(e) => update("proteses_pacemaker", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* SUPLEMENTOS */}
      <Section title="Suplementação">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Suplementos (vitaminas, proteínas, outros)">
            <Input value={form.suplementos_quais} onChange={(e) => update("suplementos_quais", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Há quanto tempo?">
            <Input value={form.suplementos_tempo} onChange={(e) => update("suplementos_tempo", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Prescritor">
            <Input value={form.suplementos_prescritor} onChange={(e) => update("suplementos_prescritor", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Alterações sentidas desde o início?">
            <Input value={form.suplementos_alteracoes} onChange={(e) => update("suplementos_alteracoes", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* DOENÇAS */}
      <Section title="Doenças">
        <CheckList
          options={[
            "Hipertensão arterial", "Colesterol", "Diabetes", "Insuficiência renal",
            "Fígado", "Tiroidismo", "Cancro", "Depressão/ansiedade",
            "Doenças autoimunes", "Epilepsia", "Respiratórias", "Fibromialgia", "Osteoporose",
          ]}
          values={form.doencas}
          onChange={(v) => update("doencas", v)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Tratamento endócrino">
            <Input value={form.tratamento_endocrino} onChange={(e) => update("tratamento_endocrino", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Tratamento oncológico">
            <Input value={form.tratamento_oncologico} onChange={(e) => update("tratamento_oncologico", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Antecedentes cirúrgicos – Quais?">
            <Input value={form.antecedentes_cirurgicos} onChange={(e) => update("antecedentes_cirurgicos", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Tipo de recuperação?">
            <Input value={form.tipo_recuperacao} onChange={(e) => update("tipo_recuperacao", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Cicatrização">
            <Input value={form.cicatrizacao} onChange={(e) => update("cicatrizacao", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* ANÁLISES CLÍNICAS */}
      <Section title="Análises Clínicas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Frequência?">
            <Input value={form.analises_frequencia} onChange={(e) => update("analises_frequencia", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Resultados recentes?">
            <Input value={form.analises_resultados} onChange={(e) => update("analises_resultados", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* PROBLEMAS CIRCULATÓRIOS */}
      <Section title="Problemas Circulatórios">
        <CheckList
          options={["Derrames", "Varizes", "Tromboflebite", "TVP"]}
          values={form.problemas_circulatorios}
          onChange={(v) => update("problemas_circulatorios", v)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Quais?">
            <Input value={form.problemas_circulatorios_quais} onChange={(e) => update("problemas_circulatorios_quais", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Sintomas? (dor, pernas pesadas, inchaço)">
            <Input value={form.problemas_circulatorios_sintomas} onChange={(e) => update("problemas_circulatorios_sintomas", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Há quanto tempo?">
            <Input value={form.problemas_circulatorios_tempo} onChange={(e) => update("problemas_circulatorios_tempo", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Origem">
            <Input value={form.problemas_circulatorios_origem} onChange={(e) => update("problemas_circulatorios_origem", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Intervencionados?">
            <Input value={form.intervencionados} onChange={(e) => update("intervencionados", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Medicação/suplementação?">
            <Input value={form.medicacao_suplementacao} onChange={(e) => update("medicacao_suplementacao", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Meias de contenção?">
            <Input value={form.meias_contencao} onChange={(e) => update("meias_contencao", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* GRAVIDEZ */}
      <Section title="Gravidez">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Se atual, quanto tempo?">
            <Input value={form.gravidez_atual_tempo} onChange={(e) => update("gravidez_atual_tempo", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Nº gravidezas">
            <Input value={form.n_gravidezas} onChange={(e) => update("n_gravidezas", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Nº partos/filhos">
            <Input value={form.n_partos} onChange={(e) => update("n_partos", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Tipo de partos">
            <Input value={form.tipo_partos} onChange={(e) => update("tipo_partos", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Tempo entre partos">
            <Input value={form.tempo_entre_partos} onChange={(e) => update("tempo_entre_partos", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Amamentação?">
            <Input value={form.amamentacao} onChange={(e) => update("amamentacao", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Fertilidade natural ou tratamentos?">
            <Input value={form.fertilidade_tratamentos} onChange={(e) => update("fertilidade_tratamentos", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Peso ganho em cada gravidez?">
            <Input value={form.peso_gravidez} onChange={(e) => update("peso_gravidez", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Recuperação pós-parto assistida?">
            <Input value={form.recuperacao_pos_parto} onChange={(e) => update("recuperacao_pos_parto", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Incontinência urinária?">
            <Input value={form.incontinencia} onChange={(e) => update("incontinencia", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Depressão pós-parto?">
            <Input value={form.depressao_pos_parto} onChange={(e) => update("depressao_pos_parto", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* MENOPAUSA */}
      <Section title="Menopausa">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* FUNÇÕES CORPORAIS */}
      <Section title="Funções Corporais">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Dieta acompanhada por nutricionista?">
            <Input value={form.dieta_nutricionista} onChange={(e) => update("dieta_nutricionista", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Funcionamento intestinal – Regularidade?">
            <Input value={form.funcionamento_intestinal} onChange={(e) => update("funcionamento_intestinal", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Forma/tipo?">
            <Input value={form.intestinal_forma} onChange={(e) => update("intestinal_forma", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Frequência urinária">
            <Input value={form.frequencia_urinaria} onChange={(e) => update("frequencia_urinaria", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Ciclo menstrual – Regularidade?">
            <Input value={form.ciclo_menstrual} onChange={(e) => update("ciclo_menstrual", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Método anticoncecional?">
            <Input value={form.metodo_anticoncecional} onChange={(e) => update("metodo_anticoncecional", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      {/* OCUPAÇÃO / ATIVIDADE */}
      <Section title="Ocupação e Atividade Física">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Horas de trabalho">
            <Input value={form.horas_trabalho} onChange={(e) => update("horas_trabalho", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Turnos?">
            <Input value={form.turnos} onChange={(e) => update("turnos", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Tempo sentado e de pé">
            <Input value={form.tempo_sentado_pe} onChange={(e) => update("tempo_sentado_pe", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Atividade física – Qual?">
            <Input value={form.atividade_fisica_qual} onChange={(e) => update("atividade_fisica_qual", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Frequência">
            <Input value={form.atividade_fisica_frequencia} onChange={(e) => update("atividade_fisica_frequencia", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Stress (familiar e profissional)">
            <Input value={form.stress} onChange={(e) => update("stress", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Intolerância a lactose ou glúten?">
            <Input value={form.intolerancia} onChange={(e) => update("intolerancia", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
        <Field label="Metabolismo e hormônios" full>
          <CheckList
            options={["Hipotireoidismo", "Resistência à insulina", "Cortisol alto (stress)", "Alterações pós-menopausa"]}
            values={form.metabolismo_hormonios}
            onChange={(v) => update("metabolismo_hormonios", v)}
          />
        </Field>
      </Section>

      {/* DISPONIBILIDADE */}
      <Section title="Disponibilidade">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Frequência disponível para tratamentos">
            <RadioGroup value={form.frequencia_tratamentos} onValueChange={(v) => update("frequencia_tratamentos", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="1x_semana" /> 1x/semana</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="2x_semana" /> 2x/semana</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="outro" /> Outro</label>
            </RadioGroup>
          </Field>
        </div>
      </Section>

      <Separator />

      {/* AVALIAÇÃO PROFISSIONAL (CORPO) */}
      <div className="text-center">
        <h2 className="text-lg font-semibold tracking-wider uppercase">Avaliação Profissional – Corpo</h2>
      </div>

      <Section title="Gordura Localizada">
        <Field label="Localização" full>
          <CheckList
            options={["Abdómen sup.", "Abdómen inf.", "Flancos", "Coxas", "Braços", "Costas", "Joelhos"]}
            values={form.gordura_localizacao}
            onChange={(v) => update("gordura_localizacao", v)}
          />
        </Field>
        <Field label="Tipo">
          <RadioGroup value={form.gordura_tipo} onValueChange={(v) => update("gordura_tipo", v)} className="flex gap-4" disabled={readOnly}>
            {["Mole", "Compacta", "Edematosa"].map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm"><RadioGroupItem value={t} /> {t}</label>
            ))}
          </RadioGroup>
        </Field>
      </Section>

      <Section title="Celulite">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Grau">
            <RadioGroup value={form.celulite_grau} onValueChange={(v) => update("celulite_grau", v)} className="flex gap-4" disabled={readOnly}>
              {["I", "II", "III", "IV"].map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm"><RadioGroupItem value={g} /> {g}</label>
              ))}
            </RadioGroup>
          </Field>
          <Field label="Tipo">
            <RadioGroup value={form.celulite_tipo} onValueChange={(v) => update("celulite_tipo", v)} className="flex flex-wrap gap-3" disabled={readOnly}>
              {["Edematosa", "Fibrosa", "Flácida", "Mista"].map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm"><RadioGroupItem value={t} /> {t}</label>
              ))}
            </RadioGroup>
          </Field>
        </div>
      </Section>

      <Section title="Flacidez">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tipo">
            <RadioGroup value={form.flacidez_tipo} onValueChange={(v) => update("flacidez_tipo", v)} className="flex gap-4" disabled={readOnly}>
              {["Cutânea", "Muscular"].map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm"><RadioGroupItem value={t} /> {t}</label>
              ))}
            </RadioGroup>
          </Field>
          <Field label="Localização">
            <Input value={form.flacidez_localizacao} onChange={(e) => update("flacidez_localizacao", e.target.value)} readOnly={readOnly} />
          </Field>
        </div>
      </Section>

      <Section title="Retenção de Líquidos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Sinal de Godet">
            <RadioGroup value={form.retencao_godet} onValueChange={(v) => update("retencao_godet", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="positivo" /> Positivo</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="negativo" /> Negativo</label>
            </RadioGroup>
          </Field>
          <Field label="Sensação de peso/inchaço">
            <CheckList
              options={["Pernas", "Braços", "Abdómen"]}
              values={form.retencao_sensacao}
              onChange={(v) => update("retencao_sensacao", v)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Pós-parto (se aplicável)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tempo desde o parto">
            <Input value={form.pos_parto_tempo} onChange={(e) => update("pos_parto_tempo", e.target.value)} readOnly={readOnly} />
          </Field>
          <Field label="Estado da pele abdominal">
            <CheckList
              options={["Normal", "Estrias", "Flácida", "Cicatriz visível"]}
              values={form.pos_parto_pele}
              onChange={(v) => update("pos_parto_pele", v)}
            />
          </Field>
          <Field label="Estado do biótipo muscular">
            <RadioGroup value={form.pos_parto_muscular} onValueChange={(v) => update("pos_parto_muscular", v)} className="flex gap-4" disabled={readOnly}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="normal" /> Normal</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="alterado" /> Alterado</label>
            </RadioGroup>
          </Field>
        </div>
      </Section>

      <Section title="Plano de Tratamento Sugerido *">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Frequência *">
            <Input value={form.plano_frequencia} onChange={(e) => update("plano_frequencia", e.target.value)} readOnly={readOnly} placeholder={ph("plano_frequencia") || ""} />
          </Field>
          <Field label="Nº sessões *">
            <Input value={form.plano_sessoes} onChange={(e) => update("plano_sessoes", e.target.value)} readOnly={readOnly} placeholder={ph("plano_sessoes") || ""} />
          </Field>
          <Field label="Reavaliação (semanas) *">
            <Input value={form.plano_reavaliacao} onChange={(e) => update("plano_reavaliacao", e.target.value)} readOnly={readOnly} placeholder={ph("plano_reavaliacao") || ""} />
          </Field>
        </div>
        <Field label="Produtos recomendados" full>
          <ProductSuggestionSelect
            value={form.plano_produtos_sugeridos ?? []}
            onChange={(v) => update("plano_produtos_sugeridos", v)}
            readOnly={readOnly}
          />
        </Field>
        <Field label="Técnicas indicadas *" full>
          <CheckList
            options={["Drenagem linfática", "Radiofrequência", "Cavitação", "Pressoterapia", "Massagem modeladora", "Criolipólise", "Indiba", "Combinação de técnicas"]}
            values={form.plano_tecnicas}
            onChange={(v) => update("plano_tecnicas", v)}
          />
        </Field>
      </Section>

      <Section title="Orientações Domiciliárias *">
        <CheckList
          options={["Hidratação diária", "Reduzir sal", "Caminhada ou atividade física leve", "Uso de creme/cosmético recomendado", "Suplementação (se aplicável)"]}
          values={form.orientacoes}
          onChange={(v) => update("orientacoes", v)}
        />
      </Section>

      <Section title="Observações *">
        <Textarea value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} readOnly={readOnly} rows={4} placeholder={ph("observacoes") || "Observações adicionais..."} />
      </Section>

      <Section title="Medidas">
        <p className="text-xs text-muted-foreground mb-4">
          B = Antes do tratamento &nbsp;|&nbsp; A = Depois do tratamento
        </p>
        <div className="flex gap-6">
          {/* Body diagram */}
          <div className="hidden lg:flex w-40 shrink-0 sticky top-4 self-start items-start justify-center">
            <BodyDiagram activeZone={activeZone} />
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-2 py-1.5 text-left font-medium w-44">Zona</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <th key={s} className="border border-border px-1 py-1.5 text-center font-medium" colSpan={2}>
                      Sessão {s}
                    </th>
                  ))}
                </tr>
                <tr className="bg-muted/30">
                  <th className="border border-border px-2 py-1" />
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <React.Fragment key={s}>
                      <th className="border border-border px-1 py-1 text-center text-[10px] text-muted-foreground w-14">B</th>
                      <th className="border border-border px-1 py-1 text-center text-[10px] text-muted-foreground w-14">A</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BODY_ZONES.map((zone) => (
                  <tr key={zone.key} className={activeZone === zone.num ? "bg-primary/5" : ""}>
                    <td className="border border-border px-2 py-1 font-medium text-foreground">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted-foreground/20 text-[10px] font-semibold text-muted-foreground shrink-0">{zone.num}</span>
                        {zone.label}
                      </span>
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
                      const bKey = `${zone.key}_s${s}_b`;
                      const aKey = `${zone.key}_s${s}_a`;
                      const medidas = form.medidas || {};
                      return (
                        <React.Fragment key={s}>
                          <td className="border border-border p-0">
                            <Input
                              className="h-6 w-12 text-[9px] border-0 rounded-none text-center px-0"
                              maxLength={4}
                              inputMode="decimal"
                              pattern="[0-9,\.]*"
                              value={medidas[bKey] || ""}
                              onChange={(e) => { const v = e.target.value.replace(/[^0-9,\.]/g, ""); update("medidas", { ...medidas, [bKey]: v }); }}
                              onFocus={() => setActiveZone(zone.num)}
                              onBlur={() => setActiveZone(null)}
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="border border-border p-0">
                            <Input
                              className="h-6 w-12 text-[9px] border-0 rounded-none text-center px-0"
                              maxLength={4}
                              inputMode="decimal"
                              pattern="[0-9,\.]*"
                              value={medidas[aKey] || ""}
                              onChange={(e) => { const v = e.target.value.replace(/[^0-9,\.]/g, ""); update("medidas", { ...medidas, [aKey]: v }); }}
                              onFocus={() => setActiveZone(zone.num)}
                              onBlur={() => setActiveZone(null)}
                              readOnly={readOnly}
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
                {/* Peso row */}
                <tr>
                  <td className="border border-border px-2 py-1 font-medium text-foreground">Peso (kg)</td>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
                    const key = `peso_s${s}`;
                    const medidas = form.medidas || {};
                    return (
                      <td key={s} className="border border-border p-0" colSpan={2}>
                        <Input
                          className="h-7 w-full text-xs border-0 rounded-none text-center px-1"
                          value={medidas[key] || ""}
                          onChange={(e) => update("medidas", { ...medidas, [key]: e.target.value })}
                          readOnly={readOnly}
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
};

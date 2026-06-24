import OpenAI from "openai";
import type { Message } from "./redis.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type AIAction =
  | { type: "agendar"; servico: string; data_hora: string }
  | { type: "mover_lead"; stage_id: string }
  | { type: "cadastrar_paciente"; nome: string }
  | { type: "none" };

export type AIResponse = {
  texto: string;
  action: AIAction;
};

function buildSystemPrompt(params: {
  clinic: { name: string; services: { nome: string; descricao: string; duracao_minutos: number }[] };
  systemPrompt?: string;
  stages: { id: string; nome: string; criterio: string }[];
}) {
  const stagesList = params.stages.length
    ? `\nColunas do pipeline disponíveis para mover o lead:\n${params.stages.map((s) => `- id: "${s.id}" | nome: "${s.nome}" | quando mover: ${s.criterio}`).join("\n")}`
    : "";

  return `${params.systemPrompt ?? `Você é a assistente virtual da ${params.clinic.name}, uma clínica de estética. Atenda pacientes pelo WhatsApp com cordialidade e eficiência.`}

Serviços disponíveis:
${params.clinic.services.map((s) => `- ${s.nome} (${s.duracao_minutos}min): ${s.descricao}`).join("\n")}
${stagesList}

Regras:
- Responda sempre em português brasileiro
- Seja breve e direto (máx. 3 parágrafos)
- Se o paciente quiser agendar, colete: serviço desejado e data/hora preferida
- Não invente informações sobre serviços ou preços
- Para mover o lead de coluna use a action "mover_lead" com o stage_id correto

Responda SEMPRE em JSON com este formato exato:
{
  "texto": "sua resposta para o paciente",
  "action": {
    "type": "none" | "agendar" | "mover_lead" | "cadastrar_paciente",
    ... campos da ação se houver
  }
}`;
}

export async function generateResponse(params: {
  clinic: { name: string; services: any[] };
  systemPrompt?: string;
  stages: { id: string; nome: string; criterio: string }[];
  history: Message[];
  userMessage: string;
}): Promise<AIResponse> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt({ clinic: params.clinic, systemPrompt: params.systemPrompt, stages: params.stages }) },
    ...params.history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: params.userMessage },
  ];

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    response_format: { type: "json_object" },
    max_tokens: 512,
    temperature: 0.4,
  });

  const raw = completion.choices[0].message.content ?? '{"texto":"Desculpe, ocorreu um erro.","action":{"type":"none"}}';

  try {
    return JSON.parse(raw) as AIResponse;
  } catch {
    return { texto: raw, action: { type: "none" } };
  }
}

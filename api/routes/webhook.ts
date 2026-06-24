import { Router } from "express";
import { validateWebhookSecret } from "../middleware/auth.js";
import { getClinicByPhone, getClinicContext, getOrCreatePatient, createAgendamento, getLeadComAgente, getOrCreateLead, getStagesComCriterios, moverLead } from "../services/supabase.js";
import { getHistory, appendMessage } from "../services/redis.js";
import { generateResponse } from "../services/openai.js";
import { sendMessage } from "../services/evoapi.js";

const router = Router();

router.post("/whatsapp", validateWebhookSecret, async (req, res) => {
  res.status(200).json({ ok: true }); // responde EvoAPI imediatamente

  try {
    const body = req.body;

    // EvoAPI payload
    const instance: string = body.instance;
    const from: string = body.data?.key?.remoteJid?.replace("@s.whatsapp.net", "") ?? "";
    const text: string = body.data?.message?.conversation ?? body.data?.message?.extendedTextMessage?.text ?? "";

    if (!from || !text) return;

    // identifica clínica pelo número da instância
    const clinic = await getClinicByPhone(instance);
    if (!clinic) {
      console.warn(`[webhook] instância sem clínica cadastrada: ${instance}`);
      return;
    }

    // busca o lead e verifica se a coluna atual tem agente ativo
    const lead = await getLeadComAgente(clinic.id, from);
    const agente = (lead?.pipeline_stages as any)?.agents;

    if (!lead || !agente?.ativo) {
      // lead não existe ainda, ou está em coluna sem agente (humano assumiu)
      // se não existe, cria na primeira coluna — sem responder ainda
      if (!lead) await getOrCreateLead(clinic.id, from, clinic.settings?.default_stage_id);
      return;
    }

    const sessionId = `${clinic.id}:${from}`;

    // busca contexto, estágios disponíveis e histórico em paralelo
    const [context, stages, history] = await Promise.all([
      getClinicContext(clinic.id),
      getStagesComCriterios(clinic.id),
      getHistory(sessionId),
    ]);

    // estágios que o agente pode mover o lead (exclui o atual)
    const stagesDisponíveis = stages
      .filter((s) => s.id !== lead.stage_id)
      .map((s) => ({ id: s.id, nome: s.nome, criterio: s.criterio_movimentacao ?? "" }));

    // gera resposta com IA
    const ai = await generateResponse({
      clinic: { name: clinic.name, services: context.services },
      systemPrompt: agente.system_prompt,
      stages: stagesDisponíveis,
      history,
      userMessage: text,
    });

    // salva no histórico
    await appendMessage(sessionId, { role: "user", content: text });
    await appendMessage(sessionId, { role: "assistant", content: ai.texto });

    // executa ações
    if (ai.action.type === "mover_lead") {
      // move o lead para a coluna indicada — se essa coluna não tem agente, a IA para automaticamente
      await moverLead(lead.id, ai.action.stage_id);
    }

    if (ai.action.type === "agendar") {
      const patient = await getOrCreatePatient(clinic.id, from);
      if (patient) {
        await createAgendamento({
          clinica_id: clinic.id,
          cliente_id: patient.id,
          servico_id: ai.action.servico,
          data_hora: ai.action.data_hora,
        });
      }
    }

    if (ai.action.type === "cadastrar_paciente") {
      await getOrCreatePatient(clinic.id, from, ai.action.nome);
    }

    await sendMessage({ instance, to: from, text: ai.texto });
  } catch (err) {
    console.error("[webhook] erro:", err);
  }
});

export default router;

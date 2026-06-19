/**
 * Redis helper — memória curta do agente.
 * Chave: conversation:{lead_id}
 * TTL: 24h
 * Limite: configurável (padrão 20 mensagens)
 *
 * REDIS_URL format: redis://:password@host:port
 */
import { connect } from "https://deno.land/x/redis@v0.31.0/mod.ts";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function conversationKey(leadId: string): string {
  return `conversation:${leadId}`;
}

function parseRedisUrl(url: string) {
  const u = new URL(url);
  return {
    hostname: u.hostname,
    port: Number(u.port) || 6379,
    password: u.password || undefined,
  };
}

async function getRedis() {
  const redisUrl = Deno.env.get("REDIS_URL");
  if (!redisUrl) throw new Error("REDIS_URL not set");
  const { hostname, port, password } = parseRedisUrl(redisUrl);
  return connect({ hostname, port, password });
}

export async function getHistory(leadId: string): Promise<ChatMessage[]> {
  let redis;
  try {
    redis = await getRedis();
    const raw = await redis.get(conversationKey(leadId));
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch (err) {
    console.error("Redis getHistory error:", err);
    return [];
  } finally {
    redis?.close();
  }
}

export async function saveHistory(
  leadId: string,
  messages: ChatMessage[],
  limit = 20,
): Promise<void> {
  let redis;
  try {
    redis = await getRedis();
    const trimmed = messages.slice(-limit);
    await redis.set(conversationKey(leadId), JSON.stringify(trimmed), { ex: 86400 });
  } catch (err) {
    console.error("Redis saveHistory error:", err);
  } finally {
    redis?.close();
  }
}

export async function appendAndSave(
  leadId: string,
  newMessages: ChatMessage[],
  limit = 20,
): Promise<ChatMessage[]> {
  const history = await getHistory(leadId);
  const updated = [...history, ...newMessages];
  const trimmed = updated.slice(-limit);
  await saveHistory(leadId, trimmed, limit);
  return trimmed;
}

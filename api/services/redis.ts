import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

const TTL = 60 * 60 * 6; // 6 horas
const MAX_MESSAGES = 10;

export type Message = { role: "user" | "assistant"; content: string };

export async function getHistory(sessionId: string): Promise<Message[]> {
  const raw = await redis.get(`chat:${sessionId}`);
  return raw ? JSON.parse(raw) : [];
}

export async function appendMessage(sessionId: string, message: Message): Promise<Message[]> {
  const history = await getHistory(sessionId);
  history.push(message);
  const trimmed = history.slice(-MAX_MESSAGES);
  await redis.setex(`chat:${sessionId}`, TTL, JSON.stringify(trimmed));
  return trimmed;
}

export async function clearHistory(sessionId: string): Promise<void> {
  await redis.del(`chat:${sessionId}`);
}

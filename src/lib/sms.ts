export interface SendSmsRequestOptions {
  requestUrl: string;
  apiKey: string;
  to: string;
  message: string;
  senderId?: string;
  callbackUrl?: string;
  bypassOptout?: boolean;
}

export async function sendSmsRequest({
  requestUrl,
  apiKey,
  to,
  message,
  senderId,
  callbackUrl,
  bypassOptout = true,
}: SendSmsRequestOptions) {
  if (!requestUrl?.trim()) throw new Error("URL de SMS inválida.");
  if (!apiKey?.trim()) throw new Error("API key de SMS em falta.");
  if (!to?.trim()) throw new Error("Número de destino inválido.");

  const body: Record<string, unknown> = {
    message,
    to: to.trim(),
    bypass_optout: bypassOptout,
  };

  if (senderId?.trim()) body.sender_id = senderId.trim();
  if (callbackUrl?.trim()) body.callback_url = callbackUrl.trim();

  const response = await fetch(requestUrl.trim(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : { message: await response.text().catch(() => "") };

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Erro ${response.status}`);
  }

  return data;
}

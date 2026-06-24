const EVOAPI_URL = process.env.EVOAPI_URL!;
const EVOAPI_KEY = process.env.EVOAPI_KEY!;

export async function sendMessage(params: {
  instance: string;
  to: string;
  text: string;
}): Promise<void> {
  await fetch(`${EVOAPI_URL}/message/sendText/${params.instance}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOAPI_KEY,
    },
    body: JSON.stringify({
      number: params.to,
      text: params.text,
    }),
  });
}

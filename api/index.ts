import express from "express";
import webhookRouter from "./routes/webhook.js";
import healthRouter from "./routes/health.js";

const app = express();
const PORT = process.env.API_PORT ?? 3001;

app.use(express.json());

app.use("/health", healthRouter);
app.use("/webhook", webhookRouter);

app.listen(PORT, () => {
  console.log(`[api] rodando na porta ${PORT}`);
});

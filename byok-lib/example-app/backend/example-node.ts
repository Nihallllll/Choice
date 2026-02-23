import express from "express";
import cors from "cors";
import { byokMiddleware, LLMFactory, type BYOKRequest } from "@byok/backend-node";
import { HumanMessage } from "@langchain/core/messages";

const app = express();
app.use(cors());
app.use(express.json());

const factory = new LLMFactory({
  litellmProxyUrl: process.env.LITELLM_PROXY_URL ?? "http://localhost:4000",
  litellmMasterKey: process.env.LITELLM_MASTER_KEY ?? "sk-master-1234",
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", backend: "node" });
});

app.post("/api/chat", byokMiddleware(), async (req, res) => {
  try {
    const { message, model } = req.body as { message: string; model?: string };
    const llm = await factory.fromRequest(req as BYOKRequest, model);
    const result = await llm.invoke([new HumanMessage(message)]);
    res.json({ response: result.content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[chat]", msg);
    res.status(500).json({ error: { message: msg } });
  }
});

app.post("/api/chat/stream", byokMiddleware(), async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  try {
    const { message, model } = req.body as { message: string; model?: string };
    const llm = await factory.fromRequest(req as BYOKRequest, model, { streaming: true });
    const stream = await llm.stream([new HumanMessage(message)]);
    for await (const chunk of stream) {
      if (chunk.content) res.write(`data: ${JSON.stringify({ token: chunk.content })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
  } finally {
    res.end();
  }
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`Node backend running → http://localhost:${PORT}`));

/**
 * example-app/backend/server.ts
 *
 * Complete example showing BYOK integration in an Express + LangChain app.
 * This is what a project owner writes — minimal changes to their existing code.
 *
 * Install:
 *   npm install express @langchain/openai @langchain/core
 *   npm install -D typescript @types/express @types/node ts-node
 */

import express from "express";
import cors from "cors";
import { byokMiddleware, type BYOKRequest } from "@byok/backend-node";
import { LLMFactory } from "@byok/backend-node";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const app = express();
app.use(cors());
app.use(express.json());

const factory = new LLMFactory({
  litellmProxyUrl: process.env.LITELLM_PROXY_URL ?? "http://localhost:4000",
  litellmMasterKey: process.env.LITELLM_MASTER_KEY ?? "sk-master-1234",
});

// ─── Health check (no auth required) ─────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Simple chat endpoint ──────────────────────────────────────────────────
app.post(
  "/api/chat",
  byokMiddleware(),  // 👈 This is the only middleware you add
  async (req, res) => {
    try {
      const { message, model } = req.body as {
        message: string;
        model?: string;
      };

      // factory.fromRequest() reads the user's key from req.byok
      // (populated by byokMiddleware above) and creates a LangChain LLM
      const llm = await factory.fromRequest(req as BYOKRequest, model);

      const response = await llm.invoke([new HumanMessage(message)]);

      res.json({ response: response.content });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Chat error:", message);
      res.status(500).json({ error: { message } });
    }
  }
);

// ─── LangChain pipeline / chain example ───────────────────────────────────
app.post(
  "/api/summarize",
  byokMiddleware(),
  async (req, res) => {
    try {
      const { text, model } = req.body as { text: string; model?: string };

      // This is a LangChain chain — the LLM uses the user's key automatically
      const llm = await factory.fromRequest(req as BYOKRequest, model);

      const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage("You are a concise summarizer. Summarize in 2-3 sentences."),
        new HumanMessage("Summarize this text: {text}"),
      ]);

      const chain = prompt.pipe(llm).pipe(new StringOutputParser());
      const summary = await chain.invoke({ text });

      res.json({ summary });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: { message } });
    }
  }
);

// ─── Streaming example ────────────────────────────────────────────────────
app.post(
  "/api/chat/stream",
  byokMiddleware(),
  async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const { message } = req.body as { message: string };
      const llm = await factory.fromRequest(req as BYOKRequest, undefined, 0.7);
      const stream = await llm.stream([new HumanMessage(message)]);

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ token: chunk.content })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    } finally {
      res.end();
    }
  }
);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

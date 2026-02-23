# @byok/backend-node

Express middleware + LangChain factory that lets users supply their own LLM API keys. Routes all calls through a LiteLLM proxy.

---

## Install

```bash
npm install express @langchain/openai @langchain/core
```

Add to your project's `package.json`:
```json
{
  "dependencies": {
    "@byok/backend-node": "file:../byok-lib/backend-node"
  }
}
```

---

## Usage

### 1. Start the LiteLLM proxy (required)

```powershell
cd byok-lib/litellm
$env:LITELLM_MASTER_KEY = "sk-master-1234"
$env:OPENAI_API_KEY_PLACEHOLDER = "placeholder"
$env:GEMINI_API_KEY_PLACEHOLDER = "placeholder"
$env:ANTHROPIC_API_KEY_PLACEHOLDER = "placeholder"
$env:GROQ_API_KEY_PLACEHOLDER = "placeholder"
uv run litellm --config config.yaml --port 4000
```

### 2. Integrate into your Express app

```typescript
import express from "express";
import { byokMiddleware, LLMFactory, type BYOKRequest } from "@byok/backend-node";
import { HumanMessage } from "@langchain/core/messages";

const app = express();
app.use(express.json()); // must come before byokMiddleware

const factory = new LLMFactory({
  litellmProxyUrl: process.env.LITELLM_PROXY_URL ?? "http://localhost:4000",
  litellmMasterKey: process.env.LITELLM_MASTER_KEY ?? "sk-master-1234",
});

// Add byokMiddleware() to any route that needs an LLM
app.post("/api/chat", byokMiddleware(), async (req, res) => {
  const llm = await factory.fromRequest(req as BYOKRequest);
  const result = await llm.invoke([new HumanMessage(req.body.message)]);
  res.json({ response: result.content });
});
```

### Streaming

```typescript
app.post("/api/chat/stream", byokMiddleware(), async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  const llm = await factory.fromRequest(req as BYOKRequest, undefined, { streaming: true });
  for await (const chunk of await llm.stream([new HumanMessage(req.body.message)])) {
    res.write(`data: ${JSON.stringify({ token: chunk.content })}\n\n`);
  }
  res.write("data: [DONE]\n\n");
  res.end();
});
```

### LangChain chains / agents

```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

app.post("/api/summarize", byokMiddleware(), async (req, res) => {
  const llm = await factory.fromRequest(req as BYOKRequest);
  const chain = ChatPromptTemplate.fromMessages([
    ["system", "Summarize in 2 sentences."],
    ["human", "{text}"],
  ]).pipe(llm).pipe(new StringOutputParser());
  res.json({ summary: await chain.invoke({ text: req.body.text }) });
});
```

---

## API

### `byokMiddleware()`
Express middleware. Reads `X-BYOK-Provider` header and `api_key` from request body (or `X-BYOK-Api-Key` header). Validates provider against whitelist (`openai`, `gemini`, `anthropic`, `groq`). Attaches `req.byok = { provider, apiKey }`. Returns `401` if missing or invalid.

**Required:** `express.json()` must be registered before `byokMiddleware()`.

### `new LLMFactory(options)`

| Option | Type | Description |
|---|---|---|
| `litellmProxyUrl` | `string` | URL of your LiteLLM proxy |
| `litellmMasterKey` | `string` | Proxy master key |
| `defaultTemperature` | `number?` | Fallback temperature (default: `0.7`) |

### `factory.fromRequest(req, model?, opts?)`
Creates a `ChatOpenAI` instance from an Express request processed by `byokMiddleware`. `opts` accepts `{ temperature?, streaming? }`.

### `factory.createChatModel(apiKey, model, opts?)`
Create an LLM directly without a request object.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LITELLM_PROXY_URL` | `http://localhost:4000` | LiteLLM proxy address |
| `LITELLM_MASTER_KEY` | `sk-master-1234` | Proxy auth key |

---

## Supported Providers & Default Models

| Provider | Default Model |
|---|---|
| `openai` | `gpt-4.1-mini` |
| `gemini` | `gemini/gemini-2.5-flash` |
| `anthropic` | `anthropic/claude-haiku-4-5` |
| `groq` | `groq/llama-3.3-70b-versatile` |


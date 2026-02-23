# BYOK — Bring Your Own Key

A drop-in library for any project to let users supply their own LLM API keys.
Users pick a provider (OpenAI, Gemini, Groq, Anthropic), paste their key,
and the library handles the rest — storage, injection, and routing.

---

## Repository Structure

```
byok-lib/
  frontend/          → TypeScript browser library (@byok/frontend)
  backend-node/      → Express middleware + LangChain factory (@byok/backend-node)
  backend-python/    → FastAPI middleware + LangChain factory
  litellm/           → LiteLLM proxy config + startup scripts
  example-app/       → Full working demo (Node.js or Python backend)
```

---

## Step 1 — Start the LiteLLM Proxy

Dependencies are managed with [uv](https://docs.astral.sh/uv/). Run `uv sync` inside `litellm/` once to install.

```powershell
# Windows PowerShell
cd litellm
$env:LITELLM_MASTER_KEY = "sk-master-1234"
$env:OPENAI_API_KEY_PLACEHOLDER = "placeholder"
$env:GEMINI_API_KEY_PLACEHOLDER = "placeholder"
$env:ANTHROPIC_API_KEY_PLACEHOLDER = "placeholder"
$env:GROQ_API_KEY_PLACEHOLDER = "placeholder"
uv run litellm --config config.yaml --port 4000
```

```bash
# Linux/Mac
cd litellm
export LITELLM_MASTER_KEY="sk-master-1234"
export OPENAI_API_KEY_PLACEHOLDER="placeholder"
export GEMINI_API_KEY_PLACEHOLDER="placeholder"
export ANTHROPIC_API_KEY_PLACEHOLDER="placeholder"
export GROQ_API_KEY_PLACEHOLDER="placeholder"
uv run litellm --config config.yaml --port 4000
```

Proxy will be running at `http://localhost:4000`.

---

## Step 2a — Node.js / Express Backend

### Install

```bash
npm install express cors @langchain/openai @langchain/core
npm install -D typescript @types/express @types/node ts-node tsup
```

Copy `backend-node/src/` into your project or install as a local package:

```json
// your project's package.json
{
  "dependencies": {
    "@byok/backend-node": "file:../byok-lib/backend-node"
  }
}
```

### Integrate (3 lines of change)

```typescript
import { byokMiddleware, LLMFactory } from "@byok/backend-node";

const factory = new LLMFactory({
  litellmProxyUrl: "http://localhost:4000",
  litellmMasterKey: "sk-master-1234",
});

// Add middleware to any route that needs AI
app.post("/api/chat", byokMiddleware(), async (req, res) => {
  const llm = await factory.fromRequest(req);         // ← user's key used here
  const result = await llm.invoke([new HumanMessage(req.body.message)]);
  res.json({ response: result.content });
});
```

### Run

```bash
cd example-app/backend
npm run dev   # runs on :3001
```

---

## Step 2b — Python / FastAPI Backend

### Install

```bash
pip install -r backend-python/requirements.txt
```

Copy `backend-python/src/backend_python/` into your project.

### Integrate (3 lines of change)

```python
from backend_python.byok_middleware import BYOKMiddleware
from backend_python.llm_factory import get_llm_from_context

app = FastAPI()
app.add_middleware(BYOKMiddleware)  # ← one line

@app.post("/api/chat")
async def chat(body: ChatRequest):
    llm = get_llm_from_context()   # ← user's key injected automatically
    response = await llm.ainvoke([HumanMessage(content=body.message)])
    return {"response": response.content}
```

### Run

```bash
cd example-app/backend
py -3.10 -m uvicorn example-python:app --port 3002
```

---

## Step 3 — Frontend Integration

### With a bundler (Vite, webpack, Next.js)

```bash
npm install @byok/frontend   # or: file:../byok-lib/frontend
```

```typescript
import { createBYOK, PROVIDERS } from "@byok/frontend";

const byok = createBYOK({
  projectId: "my-app",
  serviceName: "My App AI",
  litellmProxyUrl: "http://localhost:4000",
  litellmMasterKey: "sk-master-1234",
  providers: [PROVIDERS.openai, PROVIDERS.gemini, PROVIDERS.groq],
});

// On app startup — shows setup wizard if no key configured
await byok.guardFirstRun();

// Somewhere in your UI — settings button
document.getElementById("settings-btn").onclick = () => byok.openSettings();

// Making an AI call — key is injected automatically
const reply = await byok.client.chat([
  { role: "user", content: "Hello!" }
]);
```

### Plain HTML (no bundler)

Open `example-app/frontend/index.html` — it has the complete inline implementation.

---

## How to Test

### 1. Unit test — KeyManager

```typescript
// test/KeyManager.test.ts
import { KeyManager } from "@byok/frontend";

// Mock localStorage
const store: Record<string, string> = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
} as Storage;

const km = new KeyManager("test-project");

console.assert(km.isConfigured() === false, "Should not be configured initially");

km.setActiveProvider("openai");
km.setKey("openai", "sk-test-key-12345678");
km.setActiveModel("gpt-4o-mini");

console.assert(km.isConfigured() === true, "Should be configured after setting key");
console.assert(km.getKey("openai") === "sk-test-key-12345678", "Should return correct key");
console.assert(km.getActiveProvider() === "openai", "Should return correct provider");

km.clearAll();
console.assert(km.isConfigured() === false, "Should be cleared");

console.log("✅ KeyManager tests passed");
```

### 2. Integration test — Backend middleware

```bash
# Start LiteLLM proxy (keep this running)
cd litellm
uv run litellm --config config.yaml --port 4000

# Start example Node server (in another terminal)
cd example-app/backend
npm run dev

# Test health (no auth required)
curl http://localhost:3001/health

# Test with a real key
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "X-BYOK-Provider: openai" \
  -d '{
    "message": "Say hello in one sentence.",
    "model": "gpt-4o-mini",
    "api_key": "sk-YOUR-REAL-KEY-HERE"
  }'

# Test missing key (should return 401)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

### 3. Integration test — Python backend

```bash
# Start Python server
cd example-app/backend
py -3.10 -m uvicorn example-python:app --port 3002

# Test
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "X-BYOK-Provider: groq" \
  -d '{
    "message": "Hello!",
    "model": "groq/llama-3.1-8b-instant",
    "api_key": "gsk-YOUR-GROQ-KEY-HERE"
  }'
```

### 4. End-to-end — Open the demo page

```bash
# Make sure LiteLLM proxy is running (from Step 2)

# Serve the frontend
npx serve example-app/frontend -p 8080
# Open http://localhost:8080
# Settings modal should appear automatically (first-run)
# Enter a Groq key (free tier available at console.groq.com)
# Send a message
```

### 5. Test provider switching

In the browser console:
```javascript
// Simulate switching provider
localStorage.setItem('byok_demo-app', JSON.stringify({
  activeProvider: 'groq',
  activeModel: 'groq/llama-3.1-8b-instant',
  keys: { groq: 'gsk-your-key' }
}));
location.reload();
```

---

## Adding a New Provider

Only one file needs changing — add to `PROVIDERS` in `frontend/src/index.ts`:

```typescript
export const PROVIDERS = {
  // ... existing providers ...
  mistral: {
    id: "mistral",
    label: "Mistral AI",
    keyLabel: "Mistral API Key",
    keyPlaceholder: "...",
    docsUrl: "https://console.mistral.ai/api-keys/",
    docsInstructions: "Sign up → API Keys → Create new key",
    modelOptions: ["mistral/mistral-large-latest", "mistral/mistral-small-latest"],
    defaultModel: "mistral/mistral-small-latest",
    validateKey: (key) => key.length > 20,
  },
};
```

And add it to the LiteLLM config:

```yaml
# litellm/config.yaml
- model_name: mistral/mistral-small-latest
  litellm_params:
    model: mistral/mistral-small-latest
    api_key: "os.environ/MISTRAL_API_KEY_PLACEHOLDER"
```

That's it. No other code changes needed.

---

## Security Notes

- User API keys are stored in `localStorage` — they never hit your server's database.
- Keys are sent over HTTPS in the request body (use HTTPS in production).
- The LiteLLM master key (`sk-master-1234`) should be changed in production and kept secret.
- The master key authenticates users to your proxy — it does not give access to any LLM provider itself.

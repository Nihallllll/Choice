# byok-lib — Bring Your Own Key

A lightweight, callback-driven library that lets users supply their own LLM API keys. No proxy, no extra service — just a **frontend widget** that collects the key and a **one-function backend helper** that reads it.

```
Browser (your frontend)                      Your FastAPI / Starlette backend
┌──────────────────────────┐                 ┌──────────────────────────────┐
│  byok.getHeaders()       │ ─ your fetch ─> │  creds = extract_byok(req)   │
│  returns {               │                 │  # creds.api_key             │
│    X-BYOK-Api-Key,       │                 │  # creds.provider            │
│    X-BYOK-Provider,      │                 │  # creds.model               │
│    X-BYOK-Model          │                 │                              │
│  }                       │                 │  client = Groq(creds.api_key)│
└──────────────────────────┘                 └──────────────────────────────┘
   Key stored in localStorage                  You create the LLM client.
   Library never makes requests for you.        Library never touches LLMs.
```

---

## Project Structure

```
byok_lib/
├── pyproject.toml              Python package config
├── src/byok/
│   ├── __init__.py             Public Python API
│   ├── _types.py               BYOKCredentials dataclass
│   ├── _extract.py             extract_byok() — reads the 3 headers
│   ├── _middleware.py          BYOKMiddleware + get_byok() — optional
│   └── py.typed                PEP 561 type hint marker
└── frontend/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── types.ts            TypeScript interfaces
        ├── KeyManager.ts       localStorage read/write
        ├── SettingsUI.ts       <byok-settings> Web Component modal
        └── index.ts            createBYOK(), PROVIDERS presets
```

---

## Python Backend

### Install

```bash
# With Starlette only (minimal):
pip install -e .

# With FastAPI included:
pip install -e ".[fastapi]"

# Dev dependencies (pytest, uvicorn, fastapi):
pip install -e ".[dev]"
```

> **Note:** The library depends only on `starlette>=0.27.0`. FastAPI is optional
> because FastAPI is itself built on Starlette — `extract_byok()` works with both.

### Option A — Per-route (recommended for most projects)

Call `extract_byok(request)` inside any route that needs the user's key.
It reads the three headers and returns a `BYOKCredentials` object.
If either required header is missing it automatically raises `HTTP 401`.

```python
from fastapi import FastAPI, Request
from byok import extract_byok
from groq import Groq

app = FastAPI()

@app.post("/api/analyze")
async def analyze(request: Request, body: dict):
    creds = extract_byok(request)
    # creds.api_key  → the user's key, e.g. "gsk_..."
    # creds.provider → "groq" | "openai" | "gemini" | ...
    # creds.model    → "groq/llama-3.3-70b-versatile" (or None)

    client = Groq(api_key=creds.api_key)   # you create the client
    response = client.chat.completions.create(
        model=creds.model or "llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": body["text"]}],
    )
    return {"result": response.choices[0].message.content}
```

### Option B — Middleware (protects all routes at once)

Add `BYOKMiddleware` once and every route is protected automatically.
Retrieve the credentials anywhere in that request's lifecycle with `get_byok()`.

```python
from fastapi import FastAPI
from byok import BYOKMiddleware, get_byok
from groq import Groq

app = FastAPI()
app.add_middleware(BYOKMiddleware)
# Optional: skip extra paths beyond the defaults (/, /health, /docs, /openapi.json, /redoc)
# app.add_middleware(BYOKMiddleware, skip_paths={"/status"})

@app.post("/api/analyze")
async def analyze(body: dict):
    creds = get_byok()                     # no request param needed
    client = Groq(api_key=creds.api_key)
    ...
```

### `BYOKCredentials` reference

```python
@dataclass(frozen=True)
class BYOKCredentials:
    api_key: str           # value of X-BYOK-Api-Key header (always present)
    provider: str          # value of X-BYOK-Provider header (always present)
    model: str | None      # value of X-BYOK-Model header (None if not sent)
```

---

## Frontend

### Install

```bash
# If using npm/bundler:
npm install ./frontend        # local path
# OR once published:
# npm install @byok-lib/frontend
```

### Vanilla HTML (no bundler)

If you are not using a bundler, compile the TypeScript first:

```bash
cd frontend
npm install
npm run build       # outputs to frontend/dist/
```

Then import the compiled file in your HTML:

```html
<script type="module">
  import { createBYOK, PROVIDERS } from "./frontend/dist/byok.js";
  // ...
</script>
```

### Step 1 — Create a BYOK instance

```ts
import { createBYOK, PROVIDERS } from "@byok-lib/frontend";

const byok = createBYOK({
  projectId: "my-app",          // namespaces localStorage — use any unique string
  providers: [
    PROVIDERS.groq,             // Groq (free tier, 8 models)
    PROVIDERS.openai,           // OpenAI (GPT-4o, GPT-4o Mini)
    PROVIDERS.gemini,           // Google Gemini (Flash, Flash-Lite, Pro)
  ],
  accentColor: "#6366f1",       // optional: modal button/focus colour
});
```

### Step 2 — Block until the user has a key configured

Call `guardFirstRun()` on app load. If the user already has a key saved it
resolves immediately. If not, it opens the settings modal and waits.

```ts
await byok.guardFirstRun();
// App is ready — user definitely has a key stored now
```

### Step 3 — Add a settings button (so users can change their key)

```ts
document.getElementById("settings-btn")!.addEventListener("click", () => {
  byok.openSettings({
    onSave: (provider, key, model) => {
      console.log(`Saved ${provider} / ${model}`);
    },
    onCancel: () => {
      console.log("User dismissed settings");
    },
  });
});
```

### Step 4 — Pass the key in every API call via `getHeaders()`

`getHeaders()` is the core function of the library. It reads the stored key and
returns the three HTTP headers as a plain object — you spread it into your own
`fetch()`. The library never makes requests on your behalf.

```ts
async function analyzeArticle(url: string) {
  const headers = byok.getHeaders();

  if (!headers) {
    // User has no key configured (they skipped the modal)
    await byok.guardFirstRun();
    return;
  }

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,   // spreads X-BYOK-Api-Key, X-BYOK-Provider, X-BYOK-Model
    },
    body: JSON.stringify({ url }),
  });
  return res.json();
}
```

### Available Providers & Models

| Provider | `PROVIDERS.groq` | `PROVIDERS.openai` | `PROVIDERS.gemini` |
|---|---|---|---|
| Key prefix | `gsk_` | `sk-` | `AIza` |
| Free tier | ✅ Yes | ❌ No | ✅ Yes |
| Models | Llama 3.3 70B, Llama 3.1 8B, Compound, Compound Mini, Qwen3 32B, Kimi K2, GPT OSS 120B/20B | GPT-4o, GPT-4o Mini | Gemini 2.5 Flash, Flash-Lite, Pro |

All model values are prefixed (`groq/...`, `gemini/...`) so they work directly with LiteLLM-style routing if needed.

---

## Full Working Example (React/Next.js)

```tsx
// app/layout.tsx
"use client";
import { useEffect } from "react";
import { createBYOK, PROVIDERS } from "@byok-lib/frontend";

const byok = createBYOK({
  projectId: "perspective-app",
  providers: [PROVIDERS.groq, PROVIDERS.gemini],
});

export default function RootLayout({ children }) {
  useEffect(() => {
    byok.guardFirstRun();
  }, []);

  return (
    <html>
      <body>
        <button onClick={() => byok.openSettings()}>⚙ API Key</button>
        {children}
      </body>
    </html>
  );
}

// app/analyze/page.tsx — making an API call
async function runAnalysis(text: string) {
  const headers = byok.getHeaders();
  if (!headers) return;

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ text }),
  });
  return res.json();
}
```

```python
# backend/main.py
from fastapi import FastAPI, Request
from byok import extract_byok
from groq import Groq

app = FastAPI()

@app.post("/api/analyze")
async def analyze(request: Request, body: dict):
    creds = extract_byok(request)
    client = Groq(api_key=creds.api_key)
    result = client.chat.completions.create(
        model=creds.model or "llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": body["text"]}],
    )
    return {"result": result.choices[0].message.content}
```

---

## API Reference

### Python exports (`from byok import ...`)

| Export | Signature | Description |
|---|---|---|
| `extract_byok` | `(request: Request) → BYOKCredentials` | Reads the 3 headers. Raises `HTTP 401` if key or provider is missing. |
| `BYOKMiddleware` | `app.add_middleware(BYOKMiddleware, skip_paths={...})` | Auto-extracts on every request. Skips `/`, `/health`, `/docs`, `/openapi.json`, `/redoc` by default. |
| `get_byok` | `() → BYOKCredentials` | Returns credentials stored by `BYOKMiddleware` for the current request. Raises `HTTP 401` if called outside middleware context. |
| `BYOKCredentials` | `dataclass(api_key, provider, model?)` | Immutable credentials container. |

### Frontend exports (`from "@byok-lib/frontend"`)

| Export | Type | Description |
|---|---|---|
| `createBYOK(config)` | Function | Creates a BYOK instance. `config` takes `projectId`, `providers[]`, optional `accentColor`. |
| `getHeaders()` | `() → BYOKHeaders \| null` | Returns the 3 headers ready to spread. `null` if no key configured. |
| `guardFirstRun()` | `() → Promise<boolean>` | Opens modal if unconfigured. Resolves `true` if already set, `false` after user saves. |
| `openSettings(opts)` | `({ onSave?, onCancel? }) → SettingsUI` | Opens modal. `onSave(provider, key, model)` fires after user clicks Save. |
| `PROVIDERS` | Object | Pre-built presets: `PROVIDERS.groq`, `PROVIDERS.openai`, `PROVIDERS.gemini`. |
| `KeyManager` | Class | Direct localStorage access. Use `keyManager.clearAll()` to reset a user's stored key. |

---

## Design Principles

1. **No extra services.** No LiteLLM proxy, no middleware backend. Your `frontend + backend` stays `frontend + backend`.
2. **You own the request.** `getHeaders()` returns a plain object. You decide when and where to call your backend — the library never makes HTTP requests.
3. **Framework agnostic.** Frontend is a standard Web Component (`<byok-settings>`). Works in React, Vue, Svelte, or plain HTML. Backend is pure Starlette — works with FastAPI or bare Starlette.
4. **Minimal surface.** 4 Python exports. 6 frontend exports. Nothing else to learn.

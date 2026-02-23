# @byok/frontend

Browser TypeScript library for Bring Your Own Key. Drop-in settings UI + API client that auto-injects the user's stored LLM key into every request.

---

## Install

```bash
npm install @byok/frontend
# or add as local package:
# "@byok/frontend": "file:../byok-lib/frontend"
```

---

## Quick Start

```typescript
import { createBYOK, PROVIDERS } from "@byok/frontend";

const byok = createBYOK({
  projectId: "my-app",
  serviceName: "My AI App",
  providers: Object.values(PROVIDERS),

  // SECURE: route through your own backend (recommended)
  backendUrl: "http://localhost:3001",

  // OR direct LiteLLM (not recommended for production — exposes master key)
  // litellmProxyUrl: "http://localhost:4000",
  // litellmMasterKey: "sk-master-1234",

  accentColor: "#6366f1", // optional — customize button & modal color
});

// At app startup: show settings modal if user has no key yet
await byok.guardFirstRun();

// Send a chat message — key injected automatically
const reply = await byok.client.chat([
  { role: "user", content: "Hello!" }
]);
```

---

## Configuration

### `createBYOK(config)`

| Field | Type | Required | Description |
|---|---|---|---|
| `projectId` | `string` | ✅ | localStorage namespace |
| `serviceName` | `string` | ✅ | Shown in the settings modal title |
| `providers` | `Provider[]` | ✅ | List of selectable providers |
| `backendUrl` | `string` | ⚠️ Recommended | Your backend URL. Keys routed through your server — master key never in browser |
| `litellmProxyUrl` | `string` | Only if no `backendUrl` | Direct LiteLLM proxy URL |
| `litellmMasterKey` | `string` | Only if no `backendUrl` | Proxy auth key |
| `accentColor` | `string` | ❌ | Hex color for buttons/focus. Default: `#6366f1` |

---

## Built-in Providers

```typescript
import { PROVIDERS } from "@byok/frontend";

// Use all providers:
providers: Object.values(PROVIDERS)

// Or pick specific ones:
providers: [PROVIDERS.openai, PROVIDERS.groq]
```

Available: `openai`, `gemini`, `anthropic`, `groq` — all with current model lists and key validation.

---

## Settings UI

The settings modal is a Web Component (`<byok-settings>`). It works in React, Vue, Svelte, or plain HTML with no framework changes.

```typescript
// Open manually (e.g. from a settings button)
byok.openSettings();

// Open with a callback
byok.openSettings({
  onSave: (providerId, key, model) => console.log("Saved", providerId),
});
```

**UI features:**
- Provider dropdown
- Password input with show/hide toggle
- "Key saved" / "Not set" status badge
- Pill-style model selector with model descriptions
- Validation with clear error messages
- Click outside to close (except on first run)
- Accent color controlled by `accentColor` config field

---

## API Client

### `byok.client.chat(messages, options?)`
Sends a chat request and returns the response text as a string.

```typescript
const text = await byok.client.chat([
  { role: "system", content: "You are helpful." },
  { role: "user", content: "What is 2+2?" }
]);
```

### `byok.client.chatCompletion(messages, options?)`
Returns raw `Response` (useful for streaming or accessing headers).

### `byok.client.request(endpoint, body, method?)`
Generic passthrough for any other endpoint (embeddings, etc.).

---

## KeyManager

```typescript
byok.keyManager.isConfigured()        // true if provider + key are both set
byok.keyManager.getActiveProvider()   // "openai" | "gemini" | etc.
byok.keyManager.getActiveModel()      // currently selected model string
byok.keyManager.getKey("openai")      // stored key for a provider
byok.keyManager.clearAll()            // remove all stored keys
```

---

## Custom Provider

```typescript
import type { Provider } from "@byok/frontend";

const myProvider: Provider = {
  id: "mistral",
  label: "Mistral AI",
  keyLabel: "Mistral API Key",
  keyPlaceholder: "...",
  docsUrl: "https://console.mistral.ai/",
  docsInstructions: "1. Sign up at console.mistral.ai<br>2. Get your API key.",
  modelOptions: [
    { value: "mistral/mistral-large-latest", label: "Mistral Large", description: "Most capable" },
    { value: "mistral/mistral-small-latest", label: "Mistral Small", description: "Fast and cheap" },
  ],
  defaultModel: "mistral/mistral-small-latest",
  validateKey: (key) => key.length > 10,
};
```

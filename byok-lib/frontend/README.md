# frontend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

# @byok/frontend

Browser library for Bring Your Own Key (BYOK) functionality.

## Features

- 🔐 Secure key management in browser localStorage
- 🎨 Pre-built settings UI web component
- 🔄 Auto-injection of user keys in API requests
- 📦 Zero dependencies
- 🌐 Support for multiple LLM providers

## Installation

```bash
bun add @byok/frontend
# or
npm install @byok/frontend
```

## Quick Start

```typescript
import { createBYOK, PROVIDERS } from '@byok/frontend';

// Create BYOK instance
const byok = createBYOK({
  storageKey: 'my-app-byok',
  providers: Object.values(PROVIDERS),
});

// Check if user has configured a key
if (!byok.hasKey()) {
  byok.openSettings();
}

// Get the configured API key
const config = byok.getConfig();
console.log(config); // { provider: 'openai', apiKey: 'sk-...', model: 'gpt-4o' }
```

## API Client

Use the `ApiClient` to make requests with auto-injected keys:

```typescript
import { createApiClient } from '@byok/frontend';

const client = createApiClient('http://localhost:3000');

// Make a request - API key is automatically injected
const response = await client.post('/api/chat', {
  message: 'Hello, world!',
});
```

## Settings UI Component

The library includes a web component for managing API keys:

```html
<byok-settings></byok-settings>
```

Open programmatically:

```typescript
byok.openSettings();
```

## Build

```bash
bun install
bun run build
```

## License

MIT


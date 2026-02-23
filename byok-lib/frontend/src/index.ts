import type { BYOKConfig } from "./types";
import { KeyManager } from "./KeyManager";
import { ApiClient } from "./ApiClient";
import { SettingsUI } from "./SettingsUI";

export type { BYOKConfig, Provider, StoredSettings, ModelOption } from "./types";
export { KeyManager } from "./KeyManager";
export { ApiClient } from "./ApiClient";
export { SettingsUI } from "./SettingsUI";

/**
 * BYOK — Bring Your Own Key
 *
 * This is the single entry point for any project.
 * Initialize once at app startup, then use the returned client everywhere.
 *
 * @example
 * const byok = createBYOK({ projectId: 'my-app', ... });
 * await byok.guardFirstRun();
 * const reply = await byok.client.chat([{ role: 'user', content: 'Hello' }]);
 */
export function createBYOK(config: BYOKConfig) {
  const keyManager = new KeyManager(config.projectId);
  const client = new ApiClient(config, keyManager);

  /**
   * Opens the settings modal as a floating overlay on top of any page.
   * Works in React, Vue, plain HTML — no framework needed.
   */
  function openSettings(options: {
    isFirstRun?: boolean;
    onSave?: (providerId: string, key: string, model: string) => void;
    onCancel?: () => void;
  } = {}): SettingsUI {
    // Remove any existing modal first
    document.querySelector("byok-settings")?.remove();

    const modal = document.createElement("byok-settings") as SettingsUI;
    document.body.appendChild(modal);
    modal.init(config, keyManager, options);
    return modal;
  }

  /**
   * Call this at app startup.
   * If the user has no key configured, opens the settings wizard automatically
   * and resolves only after they save a key.
   * Returns true if already configured (no modal shown), false if modal was shown.
   */
  function guardFirstRun(): Promise<boolean> {
    if (keyManager.isConfigured()) return Promise.resolve(true);

    return new Promise((resolve) => {
      openSettings({
        isFirstRun: true,
        onSave: () => resolve(false),
        // If they close without saving, show it again (don't let them bypass)
        onCancel: () => {
          setTimeout(() => guardFirstRun().then(resolve), 100);
        },
      });
    });
  }

  return {
    keyManager,
    client,
    openSettings,
    guardFirstRun,
  };
}

// ─── Built-in Provider Presets ─────────────────────────────────────────────
// Import these in your config so you don't have to write provider definitions

export const PROVIDERS = {
  openai: {
    id: "openai",
    label: "OpenAI",
    keyLabel: "OpenAI API Key",
    keyPlaceholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
    docsInstructions:
      "1. Sign up at <strong>platform.openai.com</strong><br>2. Go to <strong>API Keys</strong><br>3. Click <strong>Create new secret key</strong><br>4. Copy and paste it above.",
    modelOptions: [
      { value: "gpt-4.1-mini", label: "GPT-4.1 Mini", description: "Fast & affordable — best for most tasks" },
      { value: "gpt-4.1", label: "GPT-4.1", description: "Smartest non-reasoning model" },
      { value: "gpt-4o", label: "GPT-4o", description: "Fast, intelligent, flexible" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Budget-friendly for focused tasks" },
    ],
    defaultModel: "gpt-4.1-mini",
    validateKey: (key: string) => key.startsWith("sk-") && key.length > 20,
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    keyLabel: "Gemini API Key",
    keyPlaceholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
    docsInstructions:
      "1. Go to <strong>Google AI Studio</strong><br>2. Click <strong>Get API Key</strong><br>3. Create a key in a new or existing project<br>4. Copy and paste it above. Free tier available!",
    modelOptions: [
      { value: "gemini/gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Best price-performance, low latency + reasoning" },
      { value: "gemini/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", description: "Fastest & most budget-friendly in the 2.5 family" },
      { value: "gemini/gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Most advanced — deep reasoning & coding" },
    ],
    defaultModel: "gemini/gemini-2.5-flash",
    validateKey: (key: string) => key.startsWith("AIza") && key.length > 20,
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    keyLabel: "Anthropic API Key",
    keyPlaceholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
    docsInstructions:
      "1. Sign up at <strong>console.anthropic.com</strong><br>2. Go to <strong>Settings → API Keys</strong><br>3. Click <strong>Create Key</strong><br>4. Copy and paste it above.",
    modelOptions: [
      { value: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5", description: "Fastest with near-frontier intelligence" },
      { value: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6", description: "Best balance of speed and intelligence" },
      { value: "anthropic/claude-opus-4-6", label: "Claude Opus 4.6", description: "Most intelligent — best for agents & coding" },
    ],
    defaultModel: "anthropic/claude-haiku-4-5",
    validateKey: (key: string) => key.startsWith("sk-ant-") && key.length > 20,
  },
  groq: {
    id: "groq",
    label: "Groq (Fast Inference)",
    keyLabel: "Groq API Key",
    keyPlaceholder: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
    docsInstructions:
      "1. Sign up at <strong>console.groq.com</strong><br>2. Go to <strong>API Keys</strong><br>3. Click <strong>Create API Key</strong><br>4. Copy and paste it above. Groq offers a <strong>free tier</strong>!",
    modelOptions: [
      { value: "groq/llama-3.3-70b-versatile", label: "Llama 3.3 70B", description: "Best quality on Groq — versatile & capable" },
      { value: "groq/llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", description: "Ultra-fast, lightweight" },
      { value: "groq/compound", label: "Compound", description: "Agentic system with web search & code execution" },
      { value: "groq/compound-mini", label: "Compound Mini", description: "Faster agentic system for lighter tasks" },
      { value: "groq/qwen/qwen3-32b", label: "Qwen3 32B", description: "Alibaba's latest 32B model" },
      { value: "groq/moonshotai/kimi-k2-instruct-0905", label: "Kimi K2", description: "Moonshot AI — strong reasoning & coding" },
      { value: "groq/openai/gpt-oss-120b", label: "GPT OSS 120B", description: "OpenAI open-weight flagship" },
      { value: "groq/openai/gpt-oss-20b", label: "GPT OSS 20B", description: "OpenAI open-weight, compact & fast" },
      { value: "groq/openai/gpt-oss-safeguard-20b", label: "GPT OSS Safeguard 20B", description: "Safety-focused moderation model" },
      { value: "groq/meta-llama/llama-prompt-guard-2-22m", label: "Llama Prompt Guard 2 22M", description: "Prompt injection & jailbreak detection" },
    ],
    defaultModel: "groq/llama-3.3-70b-versatile",
    validateKey: (key: string) => key.startsWith("gsk_") && key.length > 20,
  },
};

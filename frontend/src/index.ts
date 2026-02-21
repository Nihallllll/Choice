import type { BYOKConfig } from "./types";
import { KeyManager } from "./KeyManager";
import { ApiClient } from "./ApiClient";
import { SettingsUI } from "./SettingsUI";

export type { BYOKConfig, Provider, StoredSettings } from "./types";
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
      "1. Sign up at platform.openai.com<br>2. Go to API Keys<br>3. Click 'Create new secret key'<br>4. Copy and paste it above.",
    modelOptions: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o-mini",
    validateKey: (key: string) => key.startsWith("sk-") && key.length > 20,
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    keyLabel: "Gemini API Key",
    keyPlaceholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
    docsInstructions:
      "1. Go to Google AI Studio<br>2. Click 'Get API Key'<br>3. Create a key in a new or existing project<br>4. Copy and paste it above.",
    modelOptions: [
      "gemini/gemini-2.0-flash",
      "gemini/gemini-1.5-pro",
      "gemini/gemini-1.5-flash",
    ],
    defaultModel: "gemini/gemini-2.0-flash",
    validateKey: (key: string) => key.startsWith("AIza") && key.length > 20,
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    keyLabel: "Anthropic API Key",
    keyPlaceholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
    docsInstructions:
      "1. Sign up at console.anthropic.com<br>2. Go to Settings → API Keys<br>3. Click 'Create Key'<br>4. Copy and paste it above.",
    modelOptions: [
      "anthropic/claude-sonnet-4-5",
      "anthropic/claude-haiku-3-5",
      "anthropic/claude-opus-4",
    ],
    defaultModel: "anthropic/claude-sonnet-4-5",
    validateKey: (key: string) => key.startsWith("sk-ant-") && key.length > 20,
  },
  groq: {
    id: "groq",
    label: "Groq (Fast Inference)",
    keyLabel: "Groq API Key",
    keyPlaceholder: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
    docsInstructions:
      "1. Sign up at console.groq.com<br>2. Go to API Keys<br>3. Click 'Create API Key'<br>4. Copy and paste it above. Groq offers a free tier!",
    modelOptions: [
      "groq/llama-3.1-70b-versatile",
      "groq/llama-3.1-8b-instant",
      "groq/mixtral-8x7b-32768",
    ],
    defaultModel: "groq/llama-3.1-70b-versatile",
    validateKey: (key: string) => key.startsWith("gsk_") && key.length > 20,
  },
};
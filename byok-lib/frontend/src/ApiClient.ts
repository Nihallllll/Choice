import type { BYOKConfig } from "./types";
import { KeyManager } from "./KeyManager";

export class ApiClient {
  private keyManager: KeyManager;
  private config: BYOKConfig;

  constructor(config: BYOKConfig, keyManager: KeyManager) {
    this.config = config;
    this.keyManager = keyManager;
  }

  /**
   * Core method: sends a chat completion request to LiteLLM proxy,
   * automatically injecting the user's stored API key via extra_body.
   *
   * LiteLLM's clientside_credentials feature reads api_key from the
   * request body and uses it to call the actual LLM provider.
   */
  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
      [key: string]: unknown;
    } = {}
  ): Promise<Response> {
    const provider = this.keyManager.getActiveProvider();
    const userApiKey = provider ? this.keyManager.getKey(provider) : null;
    const model =
      options.model ??
      this.keyManager.getActiveModel() ??
      this.getDefaultModel();

    if (!userApiKey || !provider) {
      throw new Error("NO_API_KEY_CONFIGURED");
    }

    const { model: _model, ...rest } = options;

    const body = {
      model,
      messages,
      ...rest,
      // This is the LiteLLM clientside_credentials pattern:
      // LiteLLM proxy reads `api_key` from body and uses it
      // to call the actual provider instead of its own server key.
      api_key: userApiKey,
    };

    const response = await fetch(
      `${this.config.litellmProxyUrl}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // This authenticates to the LiteLLM proxy itself (the master key)
          Authorization: `Bearer ${this.config.litellmMasterKey}`,
          // We also send the provider so the backend can route correctly
          "X-BYOK-Provider": provider,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message?: string } })?.error?.message ??
          `LiteLLM request failed: ${response.status}`
      );
    }

    return response;
  }

  /**
   * Convenience method that returns the parsed content string directly.
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: Parameters<typeof this.chatCompletion>[1]
  ): Promise<string> {
    const response = await this.chatCompletion(messages, options);
    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content ?? "";
  }

  private getDefaultModel(): string {
    const providerId = this.keyManager.getActiveProvider();
    if (!providerId) return "gpt-4o-mini";
    const provider = this.config.providers.find((p) => p.id === providerId);
    return provider?.defaultModel ?? "gpt-4o-mini";
  }

  /**
   * Generic passthrough: call any LiteLLM proxy endpoint with the user's
   * key automatically injected. Useful for embeddings, image gen, etc.
   */
  async request(
    endpoint: string,
    body: Record<string, unknown>,
    method = "POST"
  ): Promise<Response> {
    const provider = this.keyManager.getActiveProvider();
    const userApiKey = provider ? this.keyManager.getKey(provider) : null;

    if (!userApiKey) throw new Error("NO_API_KEY_CONFIGURED");

    return fetch(`${this.config.litellmProxyUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.litellmMasterKey}`,
        "X-BYOK-Provider": provider ?? "",
      },
      body: JSON.stringify({ ...body, api_key: userApiKey }),
    });
  }
}

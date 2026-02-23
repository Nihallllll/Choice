import type { BYOKConfig } from "./types";
import { KeyManager } from "./KeyManager";

export class ApiClient {
  private keyManager: KeyManager;
  private config: BYOKConfig;

  constructor(config: BYOKConfig, keyManager: KeyManager) {
    this.config = config;
    this.keyManager = keyManager;
  }

  private getActiveKeyAndProvider(): { provider: string; userApiKey: string } {
    const provider = this.keyManager.getActiveProvider();
    const userApiKey = provider ? this.keyManager.getKey(provider) : null;
    if (!userApiKey || !provider) {
      throw new Error("NO_API_KEY_CONFIGURED");
    }
    return { provider, userApiKey };
  }

  private getBaseUrl(): string {
    if (this.config.backendUrl) {
      return this.config.backendUrl.replace(/\/$/, "");
    }
    if (this.config.litellmProxyUrl) {
      return this.config.litellmProxyUrl.replace(/\/$/, "");
    }
    throw new Error("Either backendUrl or litellmProxyUrl must be set in BYOKConfig.");
  }

  private buildHeaders(provider: string, userApiKey: string): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-BYOK-Provider": provider,
      "X-BYOK-Api-Key": userApiKey,
    };
    if (!this.config.backendUrl && this.config.litellmMasterKey) {
      headers["Authorization"] = `Bearer ${this.config.litellmMasterKey}`;
    }
    return headers;
  }

  private getDefaultModel(): string {
    const providerId = this.keyManager.getActiveProvider();
    if (!providerId) return "gpt-4o-mini";
    const provider = this.config.providers.find((p) => p.id === providerId);
    return provider?.defaultModel ?? "gpt-4o-mini";
  }

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
    const { provider, userApiKey } = this.getActiveKeyAndProvider();
    const model =
      options.model ??
      this.keyManager.getActiveModel() ??
      this.getDefaultModel();

    const { model: _model, ...rest } = options;

    const body: Record<string, unknown> = {
      model,
      messages,
      ...rest,
    };

    if (!this.config.backendUrl) {
      body["api_key"] = userApiKey;
    }

    const endpoint = this.config.backendUrl
      ? `${this.getBaseUrl()}/api/chat`
      : `${this.getBaseUrl()}/v1/chat/completions`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: this.buildHeaders(provider, userApiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message?: string } })?.error?.message ??
          `Request failed: ${response.status} ${response.statusText}`
      );
    }

    return response;
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: Parameters<typeof this.chatCompletion>[1]
  ): Promise<string> {
    const response = await this.chatCompletion(messages, options);
    const data = (await response.json()) as {
      choices?: Array<{ message: { content: string } }>;
      response?: string;
    };
    return data.choices?.[0]?.message?.content ?? (data.response as string) ?? "";
  }

  async request(
    endpoint: string,
    body: Record<string, unknown>,
    method = "POST"
  ): Promise<Response> {
    const { provider, userApiKey } = this.getActiveKeyAndProvider();
    const fullBody = this.config.backendUrl
      ? body
      : { ...body, api_key: userApiKey };

    return fetch(`${this.getBaseUrl()}${endpoint}`, {
      method,
      headers: this.buildHeaders(provider, userApiKey),
      body: JSON.stringify(fullBody),
    });
  }
}

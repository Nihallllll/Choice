import type { LLMFactoryOptions, BYOKRequest, CreateChatModelOptions } from "./types";

export class LLMFactory {
  private options: LLMFactoryOptions;

  constructor(options: LLMFactoryOptions) {
    this.options = options;
  }

  async createChatModel(apiKey: string, model: string, opts: CreateChatModelOptions = {}) {
    const { ChatOpenAI } = await import("@langchain/openai");
    const temperature = opts.temperature ?? this.options.defaultTemperature ?? 0.7;
    const streaming = opts.streaming ?? false;

    try {
      return new ChatOpenAI({
        openAIApiKey: this.options.litellmMasterKey,
        configuration: {
          baseURL: `${this.options.litellmProxyUrl}/v1`,
          defaultHeaders: {
            Authorization: `Bearer ${this.options.litellmMasterKey}`,
          },
        },
        modelName: model,
        temperature,
        streaming,
        modelKwargs: {
          api_key: apiKey,
        },
      });
    } catch (err) {
      throw new Error(
        `Failed to create LLM for model "${model}". Is the LiteLLM proxy running at ${this.options.litellmProxyUrl}? Original: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  async fromRequest(req: BYOKRequest, model?: string, opts: CreateChatModelOptions = {}) {
    const resolvedModel = model ?? this.getDefaultModel(req.byok.provider);
    return this.createChatModel(req.byok.apiKey, resolvedModel, opts);
  }

  private getDefaultModel(provider: string): string {
    const defaults: Record<string, string> = {
      openai: "gpt-4.1-mini",
      gemini: "gemini/gemini-2.5-flash",
      anthropic: "anthropic/claude-haiku-4-5",
      groq: "groq/llama-3.3-70b-versatile",
    };
    return defaults[provider] ?? "gpt-4.1-mini";
  }
}

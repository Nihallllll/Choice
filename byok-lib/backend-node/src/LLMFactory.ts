import type { LLMFactoryOptions, BYOKRequest } from "./types";

/**
 * LLMFactory creates LangChain-compatible LLM instances that route through
 * LiteLLM proxy using the user's own API key.
 *
 * This is the key integration point for LangChain graphs and pipelines.
 * Instead of:
 *   const llm = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY });
 *
 * Do:
 *   const factory = new LLMFactory({ litellmProxyUrl, litellmMasterKey });
 *   const llm = factory.fromRequest(req);
 */
export class LLMFactory {
  private options: LLMFactoryOptions;

  constructor(options: LLMFactoryOptions) {
    this.options = options;
  }

  /**
   * Creates a LangChain ChatOpenAI instance configured to:
   * 1. Point at the LiteLLM proxy instead of OpenAI directly
   * 2. Pass the user's actual API key via extra_body (clientside_credentials pattern)
   *
   * Works with ANY provider because LiteLLM handles the translation.
   *
   * @param apiKey  - The user's provider API key (from req.byok.apiKey)
   * @param model   - The model string (e.g. "gpt-4o-mini", "gemini/gemini-2.0-flash")
   */
  async createChatModel(
    apiKey: string,
    model: string,
    temperature = 0.7
  ) {
    // Dynamic import so the factory works even if langchain isn't installed
    const { ChatOpenAI } = await import("@langchain/openai");

    return new ChatOpenAI({
      // The LiteLLM proxy master key — just authenticates to the proxy
      openAIApiKey: this.options.litellmMasterKey,
      // Point at LiteLLM proxy instead of OpenAI
      configuration: {
        baseURL: `${this.options.litellmProxyUrl}/v1`,
        defaultHeaders: {
          Authorization: `Bearer ${this.options.litellmMasterKey}`,
        },
        // This is the LiteLLM clientside_credentials pattern:
        // any key in defaultBody gets merged into every request body.
        // LiteLLM reads `api_key` and uses it to call the actual provider.
        defaultQuery: {},
      },
      modelName: model,
      temperature,
      // Pass user's key via extra body on every call
      modelKwargs: {
        api_key: apiKey,
      },
    });
  }

  /**
   * Convenience method: creates a chat model directly from an Express request
   * that has already been processed by byokMiddleware().
   *
   * @example
   * app.post('/chat', byokMiddleware(), async (req: BYOKRequest, res) => {
   *   const llm = await factory.fromRequest(req, req.body.model);
   *   const result = await llm.invoke([{ role: 'user', content: req.body.message }]);
   *   res.json({ response: result.content });
   * });
   */
  async fromRequest(
    req: BYOKRequest,
    model?: string,
    temperature = 0.7
  ) {
    const resolvedModel = model ?? this.getDefaultModel(req.byok.provider);
    return this.createChatModel(req.byok.apiKey, resolvedModel, temperature);
  }

  private getDefaultModel(provider: string): string {
    const defaults: Record<string, string> = {
      openai: "gpt-4o-mini",
      gemini: "gemini/gemini-2.0-flash",
      anthropic: "anthropic/claude-haiku-3-5",
      groq: "groq/llama-3.1-8b-instant",
    };
    return defaults[provider] ?? "gpt-4o-mini";
  }
}

import type { Request } from "express";

export const VALID_PROVIDERS = ["openai", "gemini", "anthropic", "groq"] as const;
export type ProviderID = typeof VALID_PROVIDERS[number];

export interface LLMFactoryOptions {
  litellmProxyUrl: string;
  litellmMasterKey: string;
  defaultTemperature?: number;
}

export interface BYOKRequest extends Request {
  byok: {
    provider: ProviderID;
    apiKey: string;
  };
}

export interface CreateChatModelOptions {
  temperature?: number;
  streaming?: boolean;
  model?: string;
}

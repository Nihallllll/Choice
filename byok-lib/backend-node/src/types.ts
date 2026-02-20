import type { Request } from "express";

export interface LLMFactoryOptions {
  litellmProxyUrl: string;
  litellmMasterKey: string;
}

export interface BYOKRequest extends Request {
  byok: {
    provider: string;
    apiKey: string;
  };
}

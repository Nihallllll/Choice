export interface ModelOption {
  value: string;
  label: string;
  description?: string;
}

export interface Provider {
  id: string;
  label: string;
  keyLabel: string;
  keyPlaceholder: string;
  docsUrl: string;
  docsInstructions: string;
  modelOptions: ModelOption[];
  defaultModel: string;
  validateKey: (key: string) => boolean;
}

export interface BYOKConfig {
  projectId: string;
  serviceName: string;
  providers: Provider[];
  /**
   * When set, all LLM requests are sent to this URL instead of directly
   * to the LiteLLM proxy. The user's key is forwarded as a header.
   * This is the recommended secure mode — your server never exposes the master key.
   * Your backend must have byokMiddleware() on the receiving route.
   */
  backendUrl?: string;
  /**
   * Direct LiteLLM proxy URL. Required only when backendUrl is NOT set.
   * Avoid this in production — it exposes the master key in the browser.
   */
  litellmProxyUrl?: string;
  /** Master key for the LiteLLM proxy. Required only when backendUrl is NOT set. */
  litellmMasterKey?: string;
  /** Accent color for the settings button and modal actions. Default: #6366f1 */
  accentColor?: string;
}

export interface StoredSettings {
  activeProvider: string;
  activeModel: string;
  keys: Record<string, string>;
}

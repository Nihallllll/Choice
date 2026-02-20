export interface Provider {
  id: string;
  label: string;
  keyLabel: string;
  keyPlaceholder: string;
  docsUrl: string;
  docsInstructions: string;
  modelOptions: string[];
  defaultModel: string;
  validateKey: (key: string) => boolean;
}

export interface BYOKConfig {
  /** Unique namespace for this project — used as localStorage key prefix */
  projectId: string;
  /** Human-readable name shown in the settings UI */
  serviceName: string;
  /** URL of your running LiteLLM proxy */
  litellmProxyUrl: string;
  /** Master key for the LiteLLM proxy (not the user's LLM key) */
  litellmMasterKey: string;
  /** List of providers the user can choose from */
  providers: Provider[];
}

export interface StoredSettings {
  activeProvider: string;
  activeModel: string;
  keys: Record<string, string>; // providerId -> apiKey
}

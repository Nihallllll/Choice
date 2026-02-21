import type { StoredSettings } from "./types";

export class KeyManager {
  private readonly storageKey: string;

  constructor(projectId: string) {
    this.storageKey = `byok_${projectId}`;
  }

  private load(): Partial<StoredSettings> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private save(data: Partial<StoredSettings>): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  getActiveProvider(): string | null {
    return this.load().activeProvider ?? null;
  }

  setActiveProvider(providerId: string): void {
    this.save({ ...this.load(), activeProvider: providerId });
  }

  getActiveModel(): string | null {
    return this.load().activeModel ?? null;
  }

  setActiveModel(model: string): void {
    this.save({ ...this.load(), activeModel: model });
  }

  getKey(providerId: string): string | null {
    return this.load().keys?.[providerId] ?? null;
  }

  setKey(providerId: string, apiKey: string): void {
    const data = this.load();
    const keys = { ...(data.keys ?? {}), [providerId]: apiKey };
    this.save({ ...data, keys });
  }

  isConfigured(): boolean {
    const data = this.load();
    const provider = data.activeProvider;
    return !!(provider && data.keys?.[provider]);
  }

  getAll(): Partial<StoredSettings> {
    return this.load();
  }

  clearAll(): void {
    localStorage.removeItem(this.storageKey);
  }
}
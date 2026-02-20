import type { BYOKConfig } from "./types";
import { KeyManager } from "./KeyManager";

const STYLES = `
  :host { all: initial; }

  .overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.55);
    display: flex; align-items: center; justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .modal {
    background: #fff; border-radius: 12px;
    padding: 28px 32px; width: 480px; max-width: 95vw;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: pop 0.18s ease;
  }

  @keyframes pop {
    from { transform: scale(0.92); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }

  h2 { margin: 0 0 4px; font-size: 1.2rem; color: #111; }
  p.subtitle { margin: 0 0 20px; color: #666; font-size: 0.875rem; }

  label { display: block; font-size: 0.8rem; font-weight: 600;
          color: #333; margin-bottom: 6px; margin-top: 16px; }

  select, input[type="password"], input[type="text"] {
    width: 100%; box-sizing: border-box;
    padding: 9px 12px; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.9rem;
    transition: border-color 0.15s;
    outline: none;
  }
  select:focus, input:focus { border-color: #6366f1; }

  .key-section { display: none; }
  .key-section.active { display: block; }

  .docs-link {
    display: inline-block; margin-top: 8px;
    font-size: 0.78rem; color: #6366f1; text-decoration: none;
  }
  .docs-link:hover { text-decoration: underline; }

  .instructions {
    font-size: 0.78rem; color: #666;
    background: #f8f9fa; border-radius: 6px;
    padding: 8px 10px; margin-top: 8px;
    line-height: 1.5;
  }

  .error { color: #dc2626; font-size: 0.8rem; margin-top: 6px; min-height: 18px; }

  .actions { display: flex; gap: 10px; margin-top: 24px; justify-content: flex-end; }

  button {
    padding: 9px 20px; border-radius: 8px;
    font-size: 0.875rem; font-weight: 600;
    border: none; cursor: pointer;
    transition: opacity 0.15s;
  }
  button:hover { opacity: 0.85; }

  .btn-primary { background: #6366f1; color: #fff; }
  .btn-secondary { background: #f3f4f6; color: #333; }

  .first-run-banner {
    background: #eff6ff; border: 1px solid #bfdbfe;
    border-radius: 8px; padding: 10px 14px;
    font-size: 0.82rem; color: #1e40af;
    margin-bottom: 16px;
  }
`;

export class SettingsUI extends HTMLElement {
  private config!: BYOKConfig;
  private keyManager!: KeyManager;
  private onSaveCallback?: (providerId: string, key: string, model: string) => void;
  private isFirstRun = false;

  connectedCallback() {
    this.attachShadow({ mode: "open" });
  }

  init(
    config: BYOKConfig,
    keyManager: KeyManager,
    options: {
      isFirstRun?: boolean;
      onSave?: (providerId: string, key: string, model: string) => void;
      onCancel?: () => void;
    } = {}
  ) {
    this.config = config;
    this.keyManager = keyManager;
    this.isFirstRun = options.isFirstRun ?? false;
    this.onSaveCallback = options.onSave;
    this.render(options.onCancel);
  }

  private render(onCancel?: () => void) {
    const shadow = this.shadowRoot!;
    const { providers, serviceName } = this.config;
    const currentProvider =
      this.keyManager.getActiveProvider() ?? providers[0]?.id ?? "openai";
    const currentModel = this.keyManager.getActiveModel();

    shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="overlay">
        <div class="modal">
          <h2>Configure ${serviceName}</h2>
          <p class="subtitle">Your keys are stored locally in your browser and never sent to our servers.</p>

          ${
            this.isFirstRun
              ? `<div class="first-run-banner">
                  👋 First time here! Please add your API key to get started.
                </div>`
              : ""
          }

          <label>AI Provider</label>
          <select id="provider-select">
            ${providers
              .map(
                (p) =>
                  `<option value="${p.id}" ${p.id === currentProvider ? "selected" : ""}>${p.label}</option>`
              )
              .join("")}
          </select>

          ${providers
            .map(
              (p) => `
            <div class="key-section ${p.id === currentProvider ? "active" : ""}" data-provider="${p.id}">
              <label>${p.keyLabel}</label>
              <input
                type="password"
                placeholder="${p.keyPlaceholder}"
                value="${this.keyManager.getKey(p.id) ?? ""}"
                autocomplete="off"
              />
              <a class="docs-link" href="${p.docsUrl}" target="_blank" rel="noopener">
                How to get your ${p.label} key →
              </a>
              <div class="instructions">${p.docsInstructions}</div>

              <label>Model</label>
              <select class="model-select" data-provider="${p.id}">
                ${p.modelOptions
                  .map(
                    (m) =>
                      `<option value="${m}" ${m === (currentModel ?? p.defaultModel) ? "selected" : ""}>${m}</option>`
                  )
                  .join("")}
              </select>
            </div>
          `
            )
            .join("")}

          <div class="error" id="error-msg"></div>

          <div class="actions">
            ${!this.isFirstRun ? `<button class="btn-secondary" id="cancel-btn">Cancel</button>` : ""}
            <button class="btn-primary" id="save-btn">Save & Continue</button>
          </div>
        </div>
      </div>
    `;

    // Provider switcher
    shadow.querySelector("#provider-select")!.addEventListener("change", (e) => {
      const selected = (e.target as HTMLSelectElement).value;
      shadow.querySelectorAll(".key-section").forEach((s) => {
        s.classList.toggle("active", s.getAttribute("data-provider") === selected);
      });
    });

    // Cancel
    shadow.querySelector("#cancel-btn")?.addEventListener("click", () => {
      this.remove();
      onCancel?.();
    });

    // Save
    shadow.querySelector("#save-btn")!.addEventListener("click", () => {
      const errorEl = shadow.querySelector("#error-msg")!;
      const providerId = (shadow.querySelector("#provider-select") as HTMLSelectElement).value;
      const section = shadow.querySelector(`[data-provider="${providerId}"]`)!;
      const key = (section.querySelector("input") as HTMLInputElement).value.trim();
      const model = (section.querySelector(".model-select") as HTMLSelectElement).value;

      const provider = providers.find((p) => p.id === providerId)!;
      errorEl.textContent = "";

      if (!key) {
        errorEl.textContent = "Please enter your API key.";
        return;
      }

      if (!provider.validateKey(key)) {
        errorEl.textContent = `This doesn't look like a valid ${provider.label} key. Please check and try again.`;
        return;
      }

      this.keyManager.setActiveProvider(providerId);
      this.keyManager.setKey(providerId, key);
      this.keyManager.setActiveModel(model);

      this.onSaveCallback?.(providerId, key, model);
      this.remove();
    });
  }
}

if (!customElements.get("byok-settings")) {
  customElements.define("byok-settings", SettingsUI);
}

import type { BYOKConfig } from "./types";
import { KeyManager } from "./KeyManager";

const buildStyles = (accent: string) => `
  :host { all: initial; }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0, 0, 0, 0.6);
    display: flex; align-items: center; justify-content: center;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    backdrop-filter: blur(2px);
  }

  .modal {
    background: #fff;
    border-radius: 16px;
    width: 500px;
    max-width: 96vw;
    max-height: 92vh;
    overflow-y: auto;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0,0,0,0.06);
    animation: pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes pop {
    from { transform: scale(0.88) translateY(12px); opacity: 0; }
    to   { transform: scale(1)    translateY(0);    opacity: 1; }
  }

  .modal-header {
    padding: 24px 28px 0;
  }

  .modal-header h2 {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .modal-header p {
    margin-top: 4px;
    font-size: 0.8rem;
    color: #64748b;
    line-height: 1.5;
  }

  .modal-body {
    padding: 20px 28px 28px;
  }

  .first-run-banner {
    background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 0.8rem;
    color: #1e40af;
    margin-bottom: 20px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    line-height: 1.5;
  }

  .first-run-banner svg {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .field-group {
    margin-bottom: 18px;
  }

  .field-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  select {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.875rem;
    color: #0f172a;
    background: #f8fafc;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M1 4l5 5 5-5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 38px;
  }
  select:focus { border-color: ${accent}; background: #fff; box-shadow: 0 0 0 3px ${accent}22; }

  .key-section { display: none; }
  .key-section.active { display: block; }

  .key-input-wrap {
    position: relative;
  }

  .key-input-wrap input {
    width: 100%;
    padding: 10px 44px 10px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.875rem;
    font-family: "SF Mono", "Fira Code", monospace;
    color: #0f172a;
    background: #f8fafc;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .key-input-wrap input:focus { border-color: ${accent}; background: #fff; box-shadow: 0 0 0 3px ${accent}22; }

  .toggle-visibility {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #9ca3af;
    transition: color 0.15s;
    display: flex;
    align-items: center;
  }
  .toggle-visibility:hover { color: #374151; }

  .key-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
  }

  .docs-link {
    font-size: 0.75rem;
    color: ${accent};
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: opacity 0.15s;
  }
  .docs-link:hover { opacity: 0.75; }

  .key-status {
    font-size: 0.72rem;
    padding: 3px 8px;
    border-radius: 20px;
    font-weight: 600;
  }
  .key-status.saved { background: #dcfce7; color: #15803d; }
  .key-status.empty { background: #f1f5f9; color: #64748b; }

  .instructions {
    margin-top: 10px;
    font-size: 0.78rem;
    color: #475569;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    line-height: 1.7;
  }

  .model-pill-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .model-pill {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;
    background: #f8fafc;
    user-select: none;
  }
  .model-pill:hover { border-color: ${accent}88; background: #fff; }
  .model-pill.selected { border-color: ${accent}; background: ${accent}0d; }

  .model-pill-radio {
    width: 16px; height: 16px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .model-pill.selected .model-pill-radio {
    border-color: ${accent};
    background: ${accent};
  }
  .model-pill.selected .model-pill-radio::after {
    content: "";
    display: block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #fff;
  }

  .model-pill-info { min-width: 0; }
  .model-pill-name { font-size: 0.82rem; font-weight: 600; color: #0f172a; }
  .model-pill-desc { font-size: 0.73rem; color: #64748b; margin-top: 1px; }

  .divider { height: 1px; background: #f1f5f9; margin: 20px 0; }

  .error-msg {
    min-height: 20px;
    font-size: 0.78rem;
    color: #dc2626;
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }

  button.btn {
    padding: 10px 22px;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }
  button.btn:hover { opacity: 0.88; }
  button.btn:active { transform: scale(0.98); }

  .btn-primary { background: ${accent}; color: #fff; }
  .btn-secondary { background: #f1f5f9; color: #374151; }
  .btn-secondary:hover { background: #e2e8f0; opacity: 1; }
`;

const EYE_OPEN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_CLOSED = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

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
    const { providers, serviceName, accentColor = "#6366f1" } = this.config;
    const currentProvider = this.keyManager.getActiveProvider() ?? providers[0]?.id ?? "openai";
    const currentModel = this.keyManager.getActiveModel();

    const providerSelectOptions = providers
      .map((p) => `<option value="${p.id}" ${p.id === currentProvider ? "selected" : ""}>${p.label}</option>`)
      .join("");

    const keySections = providers.map((p) => {
      const savedKey = this.keyManager.getKey(p.id) ?? "";
      const modelPills = p.modelOptions.map((m) => {
        const val = typeof m === "string" ? m : m.value;
        const label = typeof m === "string" ? m : m.label;
        const desc = typeof m === "string" ? "" : (m.description ?? "");
        const isSelected = val === (currentModel ?? p.defaultModel);
        return `
          <div class="model-pill ${isSelected ? "selected" : ""}" data-model="${val}">
            <div class="model-pill-radio"></div>
            <div class="model-pill-info">
              <div class="model-pill-name">${label}</div>
              ${desc ? `<div class="model-pill-desc">${desc}</div>` : ""}
            </div>
          </div>`;
      }).join("");

      return `
        <div class="key-section ${p.id === currentProvider ? "active" : ""}" data-provider="${p.id}">
          <div class="field-group">
            <label class="field-label">${p.keyLabel}</label>
            <div class="key-input-wrap">
              <input
                type="password"
                placeholder="${p.keyPlaceholder}"
                value="${savedKey}"
                autocomplete="off"
                spellcheck="false"
              />
              <button class="toggle-visibility" title="Toggle visibility" aria-label="Toggle key visibility">
                ${EYE_OPEN}
              </button>
            </div>
            <div class="key-meta">
              <a class="docs-link" href="${p.docsUrl}" target="_blank" rel="noopener">
                Get your ${p.label} key â†’
              </a>
              <span class="key-status ${savedKey ? "saved" : "empty"}">${savedKey ? "Key saved" : "Not set"}</span>
            </div>
            <div class="instructions">${p.docsInstructions}</div>
          </div>

          <div class="divider"></div>

          <div class="field-group">
            <label class="field-label">Model</label>
            <div class="model-pill-list" data-pill-group="${p.id}">
              ${modelPills}
            </div>
            <input type="hidden" class="selected-model" data-provider="${p.id}" value="${currentModel ?? p.defaultModel}" />
          </div>
        </div>`;
    }).join("");

    shadow.innerHTML = `
      <style>${buildStyles(accentColor)}</style>
      <div class="overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>âš™ ${serviceName} Settings</h2>
            <p>Your keys are stored locally in your browser and never sent to our servers.</p>
          </div>
          <div class="modal-body">
            ${this.isFirstRun ? `
              <div class="first-run-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                To get started, select your AI provider, paste your API key, and choose a model.
              </div>` : ""}

            <div class="field-group">
              <label class="field-label">AI Provider</label>
              <select id="provider-select">${providerSelectOptions}</select>
            </div>

            ${keySections}

            <div class="error-msg" id="error-msg"></div>

            <div class="actions">
              ${!this.isFirstRun ? `<button class="btn btn-secondary" id="cancel-btn">Cancel</button>` : ""}
              <button class="btn btn-primary" id="save-btn">Save & Continue</button>
            </div>
          </div>
        </div>
      </div>
    `;

    shadow.querySelector("#provider-select")!.addEventListener("change", (e) => {
      const selected = (e.target as HTMLSelectElement).value;
      shadow.querySelectorAll(".key-section").forEach((s) => {
        s.classList.toggle("active", s.getAttribute("data-provider") === selected);
      });
    });

    shadow.querySelectorAll(".toggle-visibility").forEach((btn) => {
      btn.addEventListener("click", () => {
        const wrap = (btn as HTMLElement).closest(".key-input-wrap")!;
        const input = wrap.querySelector("input") as HTMLInputElement;
        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        (btn as HTMLElement).innerHTML = isHidden ? EYE_CLOSED : EYE_OPEN;
      });
    });

    shadow.querySelectorAll(".model-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const group = (pill as HTMLElement).closest(".model-pill-list")!;
        group.querySelectorAll(".model-pill").forEach((p) => p.classList.remove("selected"));
        pill.classList.add("selected");
        const providerId = group.getAttribute("data-pill-group")!;
        const hiddenInput = shadow.querySelector<HTMLInputElement>(
          `.selected-model[data-provider="${providerId}"]`
        );
        if (hiddenInput) hiddenInput.value = (pill as HTMLElement).getAttribute("data-model")!;
      });
    });

    shadow.querySelector("#cancel-btn")?.addEventListener("click", () => {
      this.remove();
      onCancel?.();
    });

    shadow.querySelector("#save-btn")!.addEventListener("click", () => {
      const errorEl = shadow.querySelector("#error-msg")!;
      const providerId = (shadow.querySelector("#provider-select") as HTMLSelectElement).value;
      const section = shadow.querySelector<HTMLElement>(`[data-provider="${providerId}"].key-section`)!;
      const key = (section.querySelector("input[type='password'], input[type='text']") as HTMLInputElement).value.trim();
      const model = (shadow.querySelector<HTMLInputElement>(`.selected-model[data-provider="${providerId}"]`))?.value ?? "";

      const provider = (this.config.providers).find((p) => p.id === providerId)!;
      errorEl.textContent = "";

      if (!key) {
        errorEl.textContent = "Please enter your API key.";
        return;
      }

      if (!provider.validateKey(key)) {
        errorEl.textContent = `That doesn't look like a valid ${provider.label} key. Please check it and try again.`;
        return;
      }

      this.keyManager.setActiveProvider(providerId);
      this.keyManager.setKey(providerId, key);
      this.keyManager.setActiveModel(model);

      this.onSaveCallback?.(providerId, key, model);
      this.remove();
    });

    shadow.querySelector(".overlay")!.addEventListener("click", (e) => {
      if (e.target === shadow.querySelector(".overlay") && !this.isFirstRun) {
        this.remove();
        onCancel?.();
      }
    });
  }
}

if (!customElements.get("byok-settings")) {
  customElements.define("byok-settings", SettingsUI);
}

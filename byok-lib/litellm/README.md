# LiteLLM Proxy Setup

The LiteLLM proxy acts as a universal translator for all LLM providers (OpenAI, Gemini, Anthropic, Groq, etc.).

## Installation

```bash
pip install 'litellm[proxy]'
```

## Running the Proxy

**Windows:**
```powershell
cd d:\Projects\Choice\byok-lib\litellm
$env:LITELLM_MASTER_KEY = "sk-master-1234"
$env:OPENAI_API_KEY_PLACEHOLDER = "placeholder"
$env:GEMINI_API_KEY_PLACEHOLDER = "placeholder"
$env:ANTHROPIC_API_KEY_PLACEHOLDER = "placeholder"
$env:GROQ_API_KEY_PLACEHOLDER = "placeholder"

# If this works:
python -m litellm --config config.yaml --port 4000

# If you get "No module named litellm.__main__", use the full path:
C:\Users\YourName\AppData\Local\Programs\Python\Python310\Scripts\litellm.exe --config config.yaml --port 4000
```

**Linux/Mac:**
```bash
export LITELLM_MASTER_KEY="sk-master-1234"
export OPENAI_API_KEY_PLACEHOLDER="placeholder"
export GEMINI_API_KEY_PLACEHOLDER="placeholder"
export ANTHROPIC_API_KEY_PLACEHOLDER="placeholder"
export GROQ_API_KEY_PLACEHOLDER="placeholder"

litellm --config config.yaml --port 4000
```

## Verify It's Running

```bash
curl http://localhost:4000/health -H "Authorization: Bearer sk-master-1234"

# Or PowerShell
Invoke-WebRequest -Uri http://localhost:4000/health -Headers @{"Authorization"="Bearer sk-master-1234"}
```

The proxy is now running on http://localhost:4000 - ready to use!

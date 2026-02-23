# Start LiteLLM Proxy without Docker
# Run this script: .\start-proxy.ps1

# litellm is managed via uv (pyproject.toml in this folder)
# Run `uv add litellm` once if not yet installed

# Set environment variables
$env:LITELLM_MASTER_KEY = "sk-master-1234"
$env:OPENAI_API_KEY_PLACEHOLDER = "placeholder"
$env:GEMINI_API_KEY_PLACEHOLDER = "placeholder"
$env:ANTHROPIC_API_KEY_PLACEHOLDER = "placeholder"
$env:GROQ_API_KEY_PLACEHOLDER = "placeholder"

Write-Host "Starting LiteLLM Proxy on http://localhost:4000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start LiteLLM proxy
uv run litellm --config config.yaml --port 4000

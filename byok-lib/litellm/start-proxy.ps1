# Start LiteLLM Proxy without Docker
# Run this script: .\start-proxy.ps1

# Check if litellm is installed
Write-Host "Checking LiteLLM installation..." -ForegroundColor Cyan
$litellmCheck = py -3 -m pip show litellm 2>$null
if (-not $litellmCheck) {
    Write-Host "LiteLLM not found. Installing..." -ForegroundColor Yellow
    py -3 -m pip install 'litellm[proxy]'
    Write-Host ""
}

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
py -3 -m litellm --config config.yaml --port 4000

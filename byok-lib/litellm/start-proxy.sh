#!/bin/bash
# Start LiteLLM Proxy without Docker
# Run this script: ./start-proxy.sh

# Set environment variables
export LITELLM_MASTER_KEY="sk-master-1234"
export OPENAI_API_KEY_PLACEHOLDER="placeholder"
export GEMINI_API_KEY_PLACEHOLDER="placeholder"
export ANTHROPIC_API_KEY_PLACEHOLDER="placeholder"
export GROQ_API_KEY_PLACEHOLDER="placeholder"

echo "Starting LiteLLM Proxy on http://localhost:4000"
echo "Press Ctrl+C to stop"
echo ""

# Start LiteLLM proxy
litellm --config config.yaml --port 4000

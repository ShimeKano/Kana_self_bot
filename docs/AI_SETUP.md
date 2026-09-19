# AI Reply with Ollama + Qwen

AI Reply is optional. Custom Message mode works without Ollama.

## Install Ollama

Windows:
```powershell
winget install Ollama.Ollama
```

macOS:
```bash
brew install ollama
```

Linux:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Download the lightweight Qwen model:
```bash
ollama pull qwen3:1.7b
ollama list
ollama serve
```

Configure `.env`:
```env
AI_ENABLED=false
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:1.7b
AI_POLL_INTERVAL_MS=5000
AI_COOLDOWN_MS=5000
```

Then run:
```bash
npm start
```

Open `http://127.0.0.1:3000`. AI Reply uses the currently selected account/channel.

Ollama is local and optional; it is not required for Custom Message mode.

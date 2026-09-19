# Kana Self Bot

Local Discord automation with a separate configuration layer and a local control panel.

## Quick start

```bash
npm install
npm start
```

Open **http://127.0.0.1:3000**.

On first start, the app creates `data/accounts.json` from `data/accounts.example.json`.

## Configuration is separated

- `data/accounts.json` → tokens + accounts + channels. **Ignored by Git.**
- `data/messages.json` → messages/commands. Change these without editing scheduler logic.
- `web/index.html` → local dashboard for adding/removing accounts and channels.
- `.env` → only non-secret runtime settings such as the dashboard port.

The dashboard masks tokens and listens on **127.0.0.1 only**. Do not expose it publicly.

## Multiple accounts and channels

1. Add an account and token in **Accounts / Tokens**.
2. Add one or more channel IDs for that account.
3. Select the active account and active channel.
4. Scheduled tasks use the selected account/channel.
5. Change a message in the **Message** panel; the scheduler reads the new value without changing its code.

Example `data/messages.json`:

```json
{
  "defaultMessage": ".tlt",
  "messages": {
    "tlt": ".tlt",
    "tl": ".tl",
    "tranyeu": ".tranyeu",
    "pvp": ".pvp"
  }
}
```

Replace any value with whatever message/command you need.

## Security

Never commit a real token. If a token has already been exposed publicly, revoke/rotate it immediately. Keep `data/accounts.json` local.

## Tests

```bash
npm test
```

## Optional AI Reply

AI Reply is a separate optional module. Custom Message/scheduled messages still work without Ollama.

For setup and model installation, see [docs/AI_SETUP.md](docs/AI_SETUP.md).

Quick model setup:
```bash
ollama pull qwen3:1.7b
ollama serve
```

The dashboard lets you switch between **Custom Message** and **AI Reply**. AI Reply watches the currently selected channel and uses the local Ollama model to generate responses.

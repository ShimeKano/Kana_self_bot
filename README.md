# Kana Self Bot

Local Discord automation with a local control panel, separate account/channel configuration, custom scheduled messages, and optional local AI replies.

> **Important:** This project uses Discord user/account tokens by design. Discord's Terms prohibit self-bots/user-token automation and an account can be restricted or terminated. Use only with accounts you control and accept that risk. Never add detection-evasion or rate-limit bypass logic.

## Features

- 🖥️ Local dashboard at `http://127.0.0.1:3000`
- 👤 Multiple accounts/tokens
- 📺 Multiple channels per account
- 🔄 Active account/channel selection
- 🛡️ Token verification with masked token display
- 🔁 Automatic account failover after HTTP 401
- 💬 Custom messages managed from the dashboard
- ⏱️ Per-message intervals
- ➕ Add multiple messages at once with commas
- ⏯️ Enable/disable individual messages
- ⭐ Set a default message
- 🚀 Send a message immediately
- 🤖 Optional local AI Reply with Ollama
- 🧠 AI uses recent channel history as context
- 🔀 Custom Message and AI Reply are mutually exclusive
- 🧪 Scheduler/automation tests

## Requirements

- Node.js 18+
- npm
- A local machine where the dashboard can stay running
- Discord account token and channel ID for your own testing
- Optional: Ollama for AI Reply

## Quick start

```bash
git clone https://github.com/ShimeKano/Kana_self_bot.git
cd Kana_self_bot
npm install
npm start
```

Open:

`http://127.0.0.1:3000`

For development:

```bash
npm run dev
```

## First-time configuration

On the first run, the app creates:

- `data/accounts.json` from `data/accounts.example.json`
- `data/messages.json` with a default `hello` message

### Accounts and channels

Real account data is stored locally in `data/accounts.json` and should never be committed.

Example:

```json
{
  "activeAccountId": "main",
  "accounts": [
    {
      "id": "main",
      "name": "Main",
      "token": "PUT_TOKEN_HERE",
      "channels": [
        {
          "id": "PUT_CHANNEL_ID_HERE",
          "name": "Main channel"
        }
      ]
    }
  ]
}
```

You can manage accounts and channels from the dashboard instead of editing this file manually.

### Message configuration

Messages are stored separately in `data/messages.json`.

Current format:

```json
{
  "defaultMessage": "hello",
  "messages": [
    {
      "id": "greeting",
      "text": "hello",
      "intervalSeconds": 50,
      "enabled": true
    }
  ]
}
```

The message text and interval are independent from the scheduler code. You can therefore change the content without changing the application logic.

When adding messages from the dashboard, comma-separated input creates separate message entries:

```text
hello, hi, chào bạn
```

Each new entry receives the selected interval.

The app also accepts the older message-object format and normalizes it when loaded.

## Dashboard

The dashboard provides:

### Accounts / Tokens
- Add account
- Edit account name/token
- Delete account
- Verify token
- See masked token preview
- See token status/error
- Disable/enable account
- Select active account

### Channels
- Add channel to an account
- Remove channel
- Select active channel

### Custom Message
- Add one or many messages
- Edit message
- Delete message
- Enable/disable message
- Set default message
- Set interval per message
- Send Now

### AI Reply
- Turn AI Reply on/off
- View active account/channel
- View polling interval and cooldown

The dashboard listens on `127.0.0.1` only. Do not expose it to the public internet.

## Account failover

If a Discord API request returns **401 Unauthorized**, the affected account is marked invalid/disabled and the app looks for the next configured account with:

- a token
- at least one channel
- an enabled account

If a valid target is found, it becomes the active account automatically.

Failover is intentionally limited to authorization failures. The app does not attempt to bypass 403, 429, or other Discord restrictions.

## Custom Message vs AI Reply

These modes are mutually exclusive:

- **Custom Message ON:** scheduled messages run normally; AI Reply is off.
- **AI Reply ON:** custom scheduled timers are stopped; AI watches the active channel and can generate replies through Ollama.
- **Both OFF:** no automatic message/reply activity.

## Optional AI Reply

AI Reply uses local Ollama.

See [docs/AI_SETUP.md](docs/AI_SETUP.md).

Quick setup:

```bash
ollama pull qwen3:1.7b
ollama serve
```

Then configure `.env`:

```env
AI_ENABLED=false
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:1.7b
AI_POLL_INTERVAL_MS=5000
AI_COOLDOWN_MS=5000
```

Set `AI_ENABLED=true` if you want AI Reply enabled when the app starts.

Ollama is optional. Custom Message mode does not require it.

## Environment variables

Copy `.env.example` to `.env` if you want to customize runtime settings.

| Variable | Default | Purpose |
|---|---:|---|
| `PORT` | `3000` | Local dashboard port |
| `AI_ENABLED` | `false` | Start AI Reply automatically |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Ollama server |
| `OLLAMA_MODEL` | `qwen3:1.7b` | Ollama model |
| `AI_POLL_INTERVAL_MS` | `5000` | AI polling interval |
| `AI_COOLDOWN_MS` | `5000` | Minimum delay between AI replies |

The legacy `ENABLE_TL`, `ENABLE_TRANYEU`, `ENABLE_PVP`, and `ENABLE_TLT` variables may still exist for compatibility with older configuration, but current Custom Message scheduling is controlled from the dashboard/message configuration.

## Project structure

```text
Kana_self_bot/
├── data/
│   ├── accounts.example.json   # Safe template
│   ├── accounts.json           # Local secrets; do not commit
│   └── messages.json           # Local message configuration
├── docs/
│   └── AI_SETUP.md
├── src/
│   ├── ai/
│   │   ├── ai-listener.js
│   │   └── ai-service.js
│   ├── automation-core.js
│   ├── config-store.js
│   ├── dashboard.js
│   ├── discord.js
│   ├── index.js
│   └── monitor.js
├── tests/
├── web/
│   └── index.html
├── .env.example
├── config.js
└── package.json
```

## Testing

Run:

```bash
npm test
```

The repository includes a basic scheduler initialization test. Before using real account data, verify the dashboard and configuration locally.

## Security

**Never commit:**
- Discord account/user tokens
- `.env` containing secrets
- `data/accounts.json`
- exported logs containing credentials

If a token is exposed, revoke/rotate it immediately.

The dashboard masks tokens in its API/UI responses, but the actual token is still stored locally in `data/accounts.json`.

## Troubleshooting

### Dashboard does not open

Check that the process is running and port 3000 is free:

```bash
npm start
```

Then open `http://127.0.0.1:3000`.

### Token shows invalid

Use **Verify Token** in the dashboard. A 401 response marks the account invalid and triggers failover when another configured account is available.

### No messages are being sent

Check:

1. An account is configured and enabled.
2. The account has a token.
3. A channel ID is configured.
4. The account/channel is selected.
5. The message is enabled.
6. AI Reply is not enabled.
7. The terminal does not show a Discord API error.

### AI Reply does not respond

Check that Ollama is running:

```bash
ollama list
ollama serve
```

Then verify `OLLAMA_URL`, `OLLAMA_MODEL`, and `AI_ENABLED`.

## Design notes

The project intentionally keeps these concerns separate:

```text
Accounts / Tokens / Channels
            ↓
       config-store
            ↓
      Discord API layer
            ↓
   ┌────────┴────────┐
Custom Message     AI Reply
   Scheduler        Listener
            ↓
        Dashboard
```

This makes message content, accounts, channels, and optional AI configuration changeable without rewriting the core scheduler.

## License

No license has been declared yet.

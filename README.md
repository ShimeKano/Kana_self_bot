# Kana Self Bot

Local Discord automation with a dashboard for managing accounts, channels, custom messages, and optional AI replies.

> **Important:** This project uses Discord user/account tokens by design. Discord prohibits self-bots/user-token automation and an account can be restricted or terminated. Use only with accounts you control and accept that risk. This project does not add detection-evasion or rate-limit bypass logic.

## Features

- 🖥️ Local dashboard at `http://127.0.0.1:3000`
- 👤 Multiple accounts/tokens
- 📺 Multiple channels per account
- 🔄 Active account/channel selection
- 🛡️ Token verification with masked token display
- 🔁 Account failover after HTTP 401
- 💬 Custom messages managed from the dashboard
- ⏱️ Per-message intervals
- ➕ Comma-separated message creation
- ⏯️ Enable/disable individual messages
- ⭐ Default message
- 🚀 Send Now
- 🤖 Optional AI Reply using an OpenAI-compatible API
- 🔍 API/model discovery from the dashboard
- 🧠 Persistent per-account AI memory in `data/memory/<accountId>.mess.txt`
- 🖥️ Live AI terminal logs in the dashboard
- 🔀 Custom Message and AI Reply are mutually exclusive

## Requirements

- Node.js 18+
- npm
- A Discord account token and channel ID for your own testing

## Quick start

```bash
npm install
npm start
```

Open `http://127.0.0.1:3000`.

Development:

```bash
npm run dev
```

## Configuration

The normal workflow is dashboard-first. You do not need to edit environment variables for accounts, channels, messages, or AI.

### Accounts and channels

Real account data is stored locally in `data/accounts.json`.

Manage accounts and channels from the dashboard. The token is masked in dashboard responses.

### Custom messages

Messages are stored in `data/messages.json`:

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

Message content and intervals are configuration data, separate from scheduler code.

### AI Reply

1. Open the dashboard.
2. Enter an OpenAI or OpenRouter API key.
3. Click **Scan API & Models**.
4. Select a discovered model.
5. Turn AI on.

The API key is stored locally in `data/ai.json`, which is ignored by Git. AI settings are not required in `.env`.

AI uses the active account/channel and polls for new messages. When AI starts or the active target changes, existing messages are treated as a baseline and are not answered retroactively.

### Memory

Each account has its own memory file:

```text
data/memory/<accountId>.mess.txt
```

Memory is loaded when that account becomes the active AI target. It can be viewed or cleared from the dashboard.

## Environment

Only the runtime port is normally needed:

```env
PORT=3000
```

If `PORT` is not set, the application uses port 3000.

## Custom Message vs AI Reply

- **Custom Message ON:** scheduled custom messages run.
- **AI Reply ON:** custom scheduled timers are stopped and AI watches the active channel.
- **Both OFF:** no automatic activity.

## Account failover

If a Discord API request returns **401 Unauthorized**, the affected account is disabled and the application searches for another configured account with a token and channel.

Failover does not attempt to bypass 403, 429, or other Discord restrictions.

## Dashboard

The dashboard provides:

- Account/token management
- Channel management
- Token verification
- Custom message management
- AI API/model configuration
- AI enable/disable
- Per-account memory view/clear
- AI live logs
- Scheduler status

Keep the dashboard bound to localhost and do not expose it publicly.

## Project structure

```text
Kana_self_bot/
├── data/
│   ├── accounts.example.json
│   ├── accounts.json
│   ├── messages.json
│   └── memory/
├── docs/
├── src/
│   ├── ai/
│   │   ├── ai-listener.js
│   │   ├── ai-provider.js
│   │   └── ai-settings-store.js
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

```bash
npm test
```

The test suite currently covers scheduler initialization.

## Security

Never commit:

- Discord account/user tokens
- `.env` files containing secrets
- `data/accounts.json`
- `data/ai.json`
- `data/memory/`
- logs containing credentials

If a token is exposed, revoke or rotate it immediately.

## Troubleshooting

### Dashboard does not open

Run:

```bash
npm start
```

Then open `http://127.0.0.1:3000`.

### AI does not reply

Check the dashboard:

1. An account and channel are active.
2. The token is valid.
3. AI API scanning succeeded.
4. A model is selected.
5. AI is enabled.
6. The **AI Live Terminal** shows successful message polling.
7. The terminal/dashboard shows no API or Discord error.

The listener retries messages when a transient AI generation or send operation fails.

## Design

```text
Accounts / Tokens / Channels
            ↓
       config-store
            ↓
      Discord API
       ↙        ↘
Custom Scheduler  AI Listener
                    ↓
             AI Provider API
                    ↓
              Account Memory
                    ↓
                Dashboard
```

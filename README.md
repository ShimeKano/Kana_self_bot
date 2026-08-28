# Kana Discord Controller

A small Discord automation/controller project for a **Discord bot account**. It monitors a configured channel and provides an HTTP control surface.

> This project intentionally uses an official Discord bot token (`DISCORD_BOT_TOKEN`). It does not support user-account/self-bot tokens.

## Setup

1. Create an application and bot in the Discord Developer Portal.
2. Enable the intents required by your application (including Message Content if your use case needs message content).
3. Invite the bot to the target server with only the permissions it needs.
4. Copy `.env.example` to `.env` and fill in:

```env
DISCORD_BOT_TOKEN=your_bot_token
CHANNEL_ID=your_channel_id
KANA_COMMAND=.tlt
BUTTON_LABELS=Bắt Đầu,Tiếp Tục
```

5. Install and start:

```bash
npm install
npm start
```

## HTTP API

- `GET /` — service and monitor status
- `GET /status` — monitor status
- `POST /start` — start the monitor
- `POST /stop` — stop the monitor

## Current architecture

- `src/discord-client.js` — official Discord gateway connection.
- `src/discord.js` — REST helpers retained for future bot-safe operations.
- `src/monitor.js` — monitoring/retry state machine.
- `src/http-server.js` — local control API.
- `config.js` — environment-driven configuration.

## Next steps

- Add structured observation/event logging.
- Add channel/guild allowlists.
- Add deterministic message/component matching instead of label-only matching.
- Add tests for retry/backoff and duplicate-event handling.
- Add persistent JSON/SQLite observation storage if required.

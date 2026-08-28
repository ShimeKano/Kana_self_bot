const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('../config');

function createClient() {
  if (!config.discord.botToken) {
    throw new Error('DISCORD_BOT_TOKEN chưa được đặt trong .env');
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message]
  });

  client.once('ready', () => {
    console.log(`[Discord] ✅ Đã đăng nhập bot: ${client.user.tag}`);
  });

  client.on('error', (error) => {
    console.error('[Discord] Client error:', error.message);
  });

  return client;
}

async function startClient() {
  const client = createClient();
  await client.login(config.discord.botToken);
  return client;
}

module.exports = { createClient, startClient };

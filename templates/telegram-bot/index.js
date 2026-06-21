// Telegram Bot Template
// Configure your bot token in config.json or .env

const config = require('./config.json') || {};

console.log(`[Telegram Bot] Starting with config:`, config);
console.log(`[Telegram Bot] Bot is now online!`);

// Keep process alive
setInterval(() => {
  console.log(`[Telegram Bot] Heartbeat - ${new Date().toISOString()}`);
}, 30000);

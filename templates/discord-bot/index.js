// Discord Bot Template
// Configure your bot token in config.json or .env

const config = require('./config.json') || {};

console.log(`[Discord Bot] Starting with config:`, config);
console.log(`[Discord Bot] Bot is now online!`);

// Keep process alive
setInterval(() => {
  console.log(`[Discord Bot] Heartbeat - ${new Date().toISOString()}`);
}, 30000);

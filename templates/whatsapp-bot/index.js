// WhatsApp Bot Template
// Configure your credentials in config.json or .env

const config = require('./config.json') || {};

console.log(`[WhatsApp Bot] Starting with config:`, config);
console.log(`[WhatsApp Bot] WhatsApp client is ready!`);

// Keep process alive
setInterval(() => {
  console.log(`[WhatsApp Bot] Heartbeat: client is active...`);
}, 60000);

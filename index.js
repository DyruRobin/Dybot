require('dotenv').config();
const {
  BaseGuildTextChannel,
  Client,
  Events,
  Collection,
  Message,
  GatewayIntentBits,
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const TOKEN = process.env.TOKEN;
const guild = process.env.GUILDID;
const cl = process.env.CLIENTID;

const client = new Client({
  intents: [
  	GatewayIntentBits.Guilds,
  	GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans,
  ],
});

let i=0;

client.on('shardError', (error, shardId) => {
	let a = new Date();
	let date = a.getDate();
	let hours = String(a.getHours()).padStart(2, "0");
	let minutes = String(a.getMinutes()).padStart(2, "0");
	let seconds = String(a.getSeconds()).padStart(2, "0");
	let time = `${date} ${hours}:${minutes}:${seconds}`;
	
	i++;
    console.error(` [${time}] Shard ${shardId} handshake timeout ${i} times:`, error.message);
});

module.exports = client;

// Load commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[FATAL] The command at ${filePath} is missing a required 'data' or 'execute' property.`);
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath);

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(TOKEN);

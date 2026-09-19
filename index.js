const crypto = require('node:crypto');
const readline = require('node:readline');
const { Writable } = require('node:stream');
const dotenv = require('dotenv');

async function loadEncryptedEnv() {
  const encrypted = require('node:fs').readFileSync('./.env.enc', 'utf8');

  const mutableStdout = new Writable({
    write(chunk, encoding, callback) {
      if (!this.muted) {
        process.stdout.write(chunk, encoding);
      }
      callback();
    }
  });

  mutableStdout.muted = false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
  });

  const password = await new Promise((resolve) => {
    rl.question('Enter .env decryption key: ', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });

    mutableStdout.muted = true;
  });

  try {
    const data = Buffer.from(encrypted, 'base64');

    const salt = data.subarray(0, 16);
    const iv = data.subarray(16, 28);
    const authTag = data.subarray(28, 44);
    const encryptedData = data.subarray(44);

    const key = crypto.scryptSync(password, salt, 32);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      iv
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]).toString('utf8');

    Object.assign(process.env, dotenv.parse(decrypted));

    console.log('.env decrypted successfully.');

  } catch (error) {
    console.error('Failed to decrypt .env.enc.');
    console.error('Wrong decryption key or corrupted .env.enc.');
    process.exit(1);
  }
}


async function start() {

  await loadEncryptedEnv();


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
  const timer = require('./timer.js');
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
}


start();

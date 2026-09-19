require('dotenv').config();
const { REST, Routes } = require('discord.js');
const GUILDID = process.env.GUILDID;
const CLIENTID = process.env.CLIENTID;
const TOKEN = process.env.TOKEN;

const rest = new REST().setToken(TOKEN);

// ...

// for guild-based commands
rest
	.put(Routes.applicationGuildCommands(CLIENTID, GUILDID), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);

// for global commands
rest
	.put(Routes.applicationCommands(CLIENTID), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);

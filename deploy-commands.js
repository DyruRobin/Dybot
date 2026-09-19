require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const CLIENTID = process.env.CLIENTID;
const GUILDID = process.env.GUILDID;
const TOKEN = process.env.TOKEN;

const commands = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[FATAL] The command at ${filePath} is missing a required 'data' or 'execute'`)
        }
    }
}

const rest = new REST().setToken(TOKEN);

(async () => {
    try {
        console.log(
        `Memulai Menyegarkan ${commands.length} aplikasi (/) commands.`,
        );

        const data = await rest.put(Routes.applicationGuildCommands(CLIENTID, GUILDID), { body : commands });

        console.log(`Berhasil mereload ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

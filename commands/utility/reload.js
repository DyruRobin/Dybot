const { PermissionFlagsBits,SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const timer = require('../../timer.js');

module.exports = {
	data: new SlashCommandBuilder()
	    .setName('reload')
	    .setDescription('Reload a command')
	    .addStringOption((option) => option.setName('command').setDescription('A command that wanted to reload.').setRequired(true))
	    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {
		await interaction.deferReply({ flags: 64 })
		const signal = "/reload";
		console.log(`${timer} INFO : Received ${signal} signal.`);
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		if (!command) {
			console.log(`${timer} INFO : Signal ${signal} return failed { ${signal} no target command ${commandName} }.`);
			return interaction.editReply(`There's no command named: \`${commandName}\`!`);
		}

		delete require.cache[require.resolve(`./${command.data.name}.js`)];
		
		try {
			const newCommand = require(`./${command.data.name}.js`);
			interaction.client.commands.set(newCommand.data.name, newCommand);
			console.log(`${timer} INFO : Signal ${signal} return completed { ${signal} ${commandName} updated }.`);
			await interaction.editReply(`Command \`${newCommand.data.name}\` has been reloaded`);
		} catch (error) {
			console.log(`${timer} INFO : Signal ${signal} return failed.`);			
			console.error(error);
			await interaction.editReply(
				`There's an error while reloading: \`${command.data.name}\`:\n\`${error.message}\``,
			);
		}
	},
};


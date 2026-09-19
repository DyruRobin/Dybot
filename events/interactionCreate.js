const { Events, Collection, MessageFlags } = require('discord.js');
const fs = require('node:fs');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (interaction.isChatInputCommand()) {
			// do command handling
        } else if (interaction.isAutocomplete()) {
        	const command = interaction.client.commands.get(interaction.commandName);
        	if (!command) {
        		console.error(`No command matching ${interaction.commandName} was found.`);
        		return;
	  		}
        	try {
        		await command.autocomplete(interaction);
    		} catch (error) {
    	   		console.error(error);
    	   	}
        } else if (interaction.isButton()) {
       		// respond to the button
       		return;
   		} else if (interaction.isStringSelectMenu()) {
        	// respond to the select menu
        	return;
       	}

        if (!interaction.client.cooldowns) {
        	interaction.client.cooldowns = new Collection();
        }

        const { cooldowns } = interaction.client;
        
        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection());
        }
        
        const now = Date.now()
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
        
        if (timestamps.has(interaction.user.id)) {
             const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
             if (now < expirationTime) {
                const expiredTimestamps = Math.round(expirationTime / 1_000);
                return interaction.reply({
                    content: `Please wait, you're on cooldown for \`${command.data.name}\``,
                    flags: MessageFlags.Ephemeral
                });
             }
        
             timestamps.set(interaction.user.id, now);
             setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
        
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    content: "There's an error while running this command!",
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: "There's an error while running this command!",
                    flags: MessageFlags.Ephemeral
                });
            }
        }

    }
};

const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const timer = require('../../timer.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('About Mortal Employee v.2')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });
		return await interaction.editReply(`About Mortal Employee.\n\na Bot created by Dyru a.k.a. ReWhimsy.\m This bot has automation script, the bot can detect a hacked account and then ban it.\nThe bot also has Auto create Message Thread for members can Comment about the media they sent in a channel that meant to be a Media Only channel.\n\nMore Detailed: \nPrivacy Policy: \n\nAuthor: }`);
	}
}

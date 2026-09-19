const { ChannelType, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const timer = require('../../timer.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('checkpermission')
		.setDescription('Check permissions of the Bot needed in this Channel.')
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('Check permissions of the Bot needed on the Selected Channel.')
				.addChannelTypes(ChannelType.GuildText))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });
		let choosedChannel = interaction.options.getChannel('channel')?.id;
		const defChannel = interaction.channelId;

		let checkChannel = interaction.guild.channels.cache.get(choosedChannel) || interaction.guild.channels.fetch(choosedChannel).id || null;
		if (checkChannel === null) return interaction.editReply(`Channel doesn't exists\n<#${choosedChannel}>`);

		let channel = interaction.guild.channels.cache.get(choosedChannel) || interaction.guild.channels.cache.get(defChannel);

		let viewChannel = channel.permissionsFor(process.env.CLIENTID).has("ViewChannel") ? '✅' : '❌';
		let sendMessage = channel.permissionsFor(process.env.CLIENTID).has("SendMessages") ? '✅' : '❌';
		let manageMessages = channel.permissionsFor(process.env.CLIENTID).has("ManageMessages") ? '✅' : '❌';
		let readMessage = channel.permissionsFor(process.env.CLIENTID).has("ReadMessageHistory") ? '✅' : '❌';
		let ban = channel.permissionsFor(process.env.CLIENTID).has("BanMembers") ? '✅' : '❌';
		let manageThreads = channel.permissionsFor(process.env.CLIENTID).has("ManageThreads") ? '✅' : '❌';
		let createThread = channel.permissionsFor(process.env.CLIENTID).has("CreatePublicThreads") ? '✅' : '❌';
		let sendMessageThread = channel.permissionsFor(process.env.CLIENTID).has("SendMessagesInThreads") ? '✅' : '❌';
		return await interaction.editReply(`Permissions in ${channel}\n\nView Channel : ${viewChannel}\nSend Message : ${sendMessageThread}\nManage Message : ${manageMessages}\nRead Message History : ${readMessage}\n\nBan Members : ${ban}\n\nManage Thread : ${manageMessages}\nCreate Thread : ${createThread}\nSend Message in Thread : ${sendMessageThread}`);
	}
}

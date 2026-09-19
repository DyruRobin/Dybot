const { ChannelType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const timer = require('../../timer.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('banned-members')
		.setDescription('View only the list of Banned User(s)')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addStringOption((option) =>
			option
				.setName('search-user-id')
				.setDescription('View informations only of the selected User ID from data exist.'))
		.addStringOption((option) =>
			option
				.setName('remove-user-id')
				.setDescription('Remove user informations of the selected User ID from the data if exist.'))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const { encrypt, decrypt } = require('../../fileCrypto');

		await interaction.deferReply({ flags: 64 });
		const signal = "/banned-members";
		console.log(`${timer} INFO : Received ${signal} signal.`);

		function logs(notice, text) {
			console.log(timer, notice, ": Signal", signal, text);
			return;
		}

		const interactionChannelID = interaction.channelId;
		const guild = interaction.guildId;
		const channel = interaction.guild.channels.cache;
		let searchBannedUserId = interaction.options.getString("search-user-id");
		let removeBannedUserId = interaction.options.getString("remove-user-id");

		const bannedUserFile = "./guild/banned-members.json";

		if (!fs.existsSync(bannedUserFile)) {
			console.log(`${timer} CRITICAL : /banned-members.json file is missing.`);
			let a = {};
			console.log(`${timer} WARNING : Creating /banned-members.json.`);
			fs.writeFileSync(bannedUserFile, encrypt(JSON.stringify(a)));
		}

		function findBannedUser() {
			let newReadBannedUser = decrypt(fs.readFileSync(bannedUserFile, "utf8"));
			let newBannedUser = JSON.parse(newReadBannedUser);
			return { newReadBannedUser, newBannedUser };
		}

		let optionsFile = "./guild/options.json";
		let readOption = decrypt(fs.readFileSync(optionsFile, "utf8"));
		let option = JSON.parse(readOption)

		let readBannedUser = decrypt(fs.readFileSync(bannedUserFile, "utf8"));
		let bannedUser = JSON.parse(readBannedUser);

		let status = "\n\nStatus :\n";
		let channelReminder = ``;
		let channelActiveReminder = ``;
		let logChannelReminder = ``;
		let reminder;

		if (option["autoban-channel"] === null) {
			channelReminder = `- Current \`autoban-channel\` is \`null\`\nDon't forget to choose a channel for Auto Ban to works by using /setup-autoban.\n`;
		} else {
			channelReminder = `- Current \`autoban-channel\` is <#${option["autoban-channel"]}>.\n`;
		}
		if (option["autoban-active"] === false) {
			channelActiveReminder = `- Current \`autoban-active\` is \`false\`\nDon't forget to activate the autoban for Auto Ban to works by using /setup-autoban.\n`;
		} else {
			channelActiveReminder = `- Current \`autoban-active\` is \`${option["autoban-active"]}\`.\n`;
		}
		if (option["log-channel"] === null) {
			logChannelReminder = `- Current \`log-channel\` is \`null\`\nDon't forget to choose a channel for everything to work by using /setup-autoban log-channel\n`;
		} else {
			logChannelReminder = `- Current \`log-channel\` is <#${option["log-channel"]}>\n`;
		}

		reminder = channelReminder + channelActiveReminder + logChannelReminder;

		let change = false;
		let text;
		let o1 = ``, o2 = ``;
		let ftext;
		let f1 = ``, f2 = ``;
		let isError = false;

		let searchResult;
		let removeResult;

		if (typeof removeBannedUserId === "string") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			let removeIndex = bannedUser.findIndex(user => Object.hasOwn(user, removeBannedUserId));
			console.log(removeIndex);
			if (removeIndex !== -1) {
				try {
					bannedUser.splice(removeIndex, 1);
					change = true;

					o2 = `Removed :\n<@${removeBannedUserId}> from data.\n\n`;
				} catch (error) {
					isError = true;
					console.error(error);
				}
			} else {
				f2 = `<@${removeBannedUserId}> Doesn't exist in the data while removing.\n`;
			}
		}

		if (typeof searchBannedUserId === "string") {
			let searchIndex = bannedUser.findIndex(user => Object.hasOwn(user, searchBannedUserId));
			if (searchIndex !== -1) {
				try {
					o1 = `Search result :\n${JSON.stringify(bannedUser[searchIndex], null, 2)}\n\n`;
				} catch (error) {
					isError = true;
					console.error(error);
				}
			} else {
				f1 = `Search result :\nNot found.\n`;
			}
		}

		text = o1 + o2;
		ftext = f1 + f2;
		let logText;
		let resultText = ``;

		if (ftext === true) {
			resultText = `There's something error while executing.\n`;
		} else {
			resultText = `Interaction Successfully.\n`;
		}

		if (change === true) {
			fs.writeFileSync(bannedUserFile, encrypt(JSON.stringify(bannedUser)));
			logText = `<@${interaction.user.id}> Updated Banned Member Information`;
			const logEmbed = new EmbedBuilder()
				.setColor('008000')
				.setTitle(logText)
				.setDescription(`${text}`)
				.setTimestamp();
			channel.get(option["log-channel"]).send({ embeds: [logEmbed] }).catch(console.error);

			logs("INFO", "return successfully.");
			return await interaction.editReply(`${resultText}\n${text}\n${ftext}\n\n${reminder}`);
		}

		const embed = new EmbedBuilder()
			.setColor('008000')
			.setTitle('Banned Member Information')
			.setDescription(`**Listing is not implemented yet.**\n${text}${status}${reminder}`)
			.setTimestamp();

		logs("INFO", "return successfully.");
		await interaction.editReply(`${resultText}\n${text}\n${ftext}`);
		return await channel.get(interactionChannelID).send({ embeds: [embed] }).catch(console.error);
	}
}

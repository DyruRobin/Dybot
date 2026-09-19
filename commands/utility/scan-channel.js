const { ChannelType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const timer = require('../../timer.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scan-channel')
		.setDescription('View only the list of the channel(s) scan Information.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addChannelOption((option) =>
			option
				.setName('add-channel')
				.setDescription('Choose a channel into the scan list.')
				.addChannelTypes(ChannelType.GuildText))
		.addChannelOption((option) => 
			option
				.setName('remove-channel')
				.setDescription('Remove a channel from the scan list.')
				.addChannelTypes(ChannelType.GuildText)),
	async execute(interaction) {
		const { encrypt, decrypt } = require('../../fileCrypto');
		await interaction.deferReply({ flags: 64 });
		const signal = "/scan-channel";
		console.log(`${timer} INFO : Received ${signal} signal.`);

		let addChannel = interaction.options.getChannel("add-channel")?.id;
		let removeChannel = interaction.options.getChannel("remove-channel")?.id;
		let interactionChannelId = interaction.channelId;
		let channel = interaction.guild.channels.cache;
		let guildId = interaction.guildId;

		function logs(notice, text) {
			console.log(timer, notice, ": Signal", signal, text);
			return;
		}

		const guildPath = "./guild/";
		const channelsFile = guildPath + "channels.json";
		const guildOptions = guildPath + "options.json";

		if (!fs.existsSync(channelsFile)) {
			console.log(`${timer} CRITICAL : /channels.json file is missing.`);
			let a = [];
			console.log(`${timer} WARNING : Creating /channels.json.`);
			fs.writeFileSync(channelsFile, encrypt(JSON.stringify(a)));
		}

		if (!fs.existsSync(channelsFile)) {
			logs("CRITICAL", "return failed { ./guild/channels.json is missing }.");
			return await interaction.editReply(`\`./guild/channels.json\` is **Missing**\nPlease restart the bot`);
		};
		if (!fs.existsSync(guildOptions)) {
			logs("CRITICAL", "return failed { ./guild/options.json is missing }.");
			return await interaction.editReply(`\`./guild/options.json\` is **Missing**\nPlease restart the bot`);
		};

		let readChannels = decrypt(fs.readFileSync(channelsFile, "utf8"));
		let readOptions = decrypt(fs.readFileSync(guildOptions, "utf8"));

		let channelCurrent = JSON.parse(readChannels);
		let option = JSON.parse(readOptions);

		function list() {
			let newReadChannels = decrypt(fs.readFileSync(channelsFile, "utf8"));
			let newChannelCurrent = JSON.parse(newReadChannels);
			let result = "";
			let a = 0;
			for (let ch of channelCurrent) {
				a+=1;
				result += a + ". <#" + ch + ">\n";
			};
			return "Channel(s) scan list :\n" + result;
		}
		const listBefore = list();

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

		if (option["autoban-channel"] !== null && addChannel === option["autoban-channel"] || removeChannel === option["autoban-channel"]) {
			return await interaction.editReply(`Adding or Removing channel into the scan list, should not same as \`autoban-channel\` channel's`);
		}

		if (typeof addChannel === "string") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			try {
				let existsAddChannel = interaction.guild.channels.cache.get(addChannel)?.id || interaction.guild.channels.fetch(addChannel)?.id || null;
			} catch (error) {
				console.error(error);
				return await interaction.editReply(`Error while fetching add channel`);
			}
			if (existsAddChannel !== null) {
				if (channelCurrent.indexOf(addChannel) === -1) {
					try {
						channelCurrent.push(addChannel);
						change = true;

						o1 = `Added :\n<#${addChannel}>\n\n`;
					} catch (error) {
						console.error(error);
						isError = true;
					}
				} else {
					f1 = `<#${addChannel}> already added.\n`;
				}
			} else {
				f1 = `There's no channel ID for\n\`add-channel\`: <#${addChannel}>\n`;
			}
		}
	
		if (typeof removeChannel === "string") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			try {
				let existsAddChannel = interaction.guild.channels.cache.get(removeChannel)?.id || interaction.guild.channels.fetch(removeChannel)?.id || null;
			} catch (error) {
				console.error(error);
				return await interaction.editReply(`Error while fetching remove channel`);
			}
			if (existsAddChannel !== null) {
				let channelHas = channelCurrent.indexOf(removeChannel);
				if (channelHas !== -1) {
					try {
						channelCurrent.splice(channelHas, 1);
						change = true;

						o2 = `Removed :\n<#${removeChannel}>\n\n`;
					} catch (error) {
						console.error(error);
						isError = true;
					}
				} else {
					f2 = `There's no <#${removeChannel}> Channel in the data.\n`;
				}
			} else {
				f2 = `There's no channel ID for\n\`remove-channel\`: <#${removeChannel}>\n`;
			}
		}

		text = o1 + o2;
		ftext = f1 + f2;
		let logText;
		let resultText = ``;

		if (isError === true) {
			resultText = `There's an error while executing the interaction.\n`;
		} else {
			resultText = `Interaction Successfully.\n`;
		}

		if (change === true) {
			fs.writeFileSync(channelsFile, encrypt(JSON.stringify(channelCurrent)));
			logText = `<@${interaction.user.id}> Updated Scan Channel`;
			const logEmbed = new EmbedBuilder()
				.setColor('008000')
				.setTitle(logText)
				.setDescription(`${text}Before :\n${listBefore}\n\nAfter :\n${list()}`)
				.setTimestamp();
			channel.get(option["log-channel"]).send({ embeds: [logEmbed] }).catch(console.error);

			logs("INFO", "return successfully.");
			return await interaction.editReply(`${resultText}\n${text}\n${ftext}${status}${reminder}`);
		}

		const embed = new EmbedBuilder()
			.setColor('008000')
			.setTitle('Auto Ban Scan Channel(s) List')
			.setDescription(`${text}${list()}${status}${reminder}`)
			.setTimestamp();

		logs("INFO", "return successfully.");
		await interaction.editReply(`${resultText}\n${text}\n${ftext}${status}${reminder}`);
		return await channel.get(interactionChannelId).send({ embeds: [embed] }).catch(console.error);
	}
}

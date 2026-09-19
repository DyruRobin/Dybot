const { ChannelType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const timer = require('../../timer.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup-autoban')
		.setDescription('View only the setup Information.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addBooleanOption((option) =>
			option
				.setName('autoban-active')
				.setDescription('Turn ON/OFF Auto-BAN'))
		.addChannelOption((option) =>
			option
				.setName('autoban-channel')
				.setDescription('Choose channel for Auto-BAN.')
				.addChannelTypes(ChannelType.GuildText))
		.addBooleanOption((option) =>
			option
				.setName('remove-autoban-channel')
				.setDescription('Remove Auto Ban Channel (Does Not DELETE the actual channel)'))
		.addChannelOption((option) =>
			option
				.setName('log-channel')
				.setDescription('Choose channel for the bot send logs.')
				.addChannelTypes(ChannelType.GuildText))
		.addBooleanOption((option) =>
			option
				.setName('remove-log-channel')
				.setDescription('Remove Log Channel (Does Not DELETE the actual channel)'))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const { encrypt, decrypt } = require('../../fileCrypto');
		await interaction.deferReply({ flags: 64 });
		const signal = "/setup-autoban";
		console.log(`${timer} INFO : Received ${signal} signal.`);

		const interactionChannelID = interaction.channelId;
		const channel = interaction.guild.channels.cache;
		const autoban = interaction.options.getBoolean("autoban-active");
		let autobanChannelTarget = interaction.options.getChannel('autoban-channel')?.id;
		let removeAutobanChannelTarget = interaction.options.getBoolean('remove-autoban-channel');
		let logChannel = interaction.options.getChannel('log-channel')?.id;
		let removeLogChannel = interaction.options.getBoolean("remove-log-channel");

		const optionsFile = "./guild/options.json";

		if (!fs.existsSync(optionsFile)) {
			logs("CRITICAL", "return failed { ./guild/options.json is missing }.");
			return await interaction.editReply(`\`./guild/options.json\` is **Missing**\nPlease restart the bot`);
		};

		function listOption() {
			let newReadOption = decrypt(fs.readFileSync(optionsFile, "utf8"));
			let newOption = JSON.parse(newReadOption);
			return { newReadOption, newOption };
		}
		const listReadOptionBefore = listOption().newReadOption;
		const listOptionBefore = listOption().newOption;

		let checkOptions = decrypt(fs.readFileSync(optionsFile, "utf8"));
		let option = JSON.parse(checkOptions);
		let autobanBefore = option["autoban-active"];
		let autobanChannelTargetBefore = option["autoban-channel"];
		const readOptionsBefore = checkOptions;

		let status = "\n\nStatus :\n";
		let channelReminder = ``;
		let channelActiveReminder = ``;
		let logChannelReminder = ``;
		let reminder;

		if (option["autoban-channel"] === null) {
			channelReminder = `- Current \`autoban-channel\` is \`null\`\nDon't forget to choose a channel for Auto Ban to works by using /setup-autoban.\n`;
		} else {
			channelReminder = `- Current \`autoban-channel\` is <#${listOption().newOption["autoban-channel"]}>.\n`;
		}
		if (option["autoban-active"] === false) {
			channelActiveReminder = `- Current \`autoban-active\` is \`false\`\nDon't forget to activate the autoban for Auto Ban to works by using /setup-autoban.\n`;
		} else {
			channelActiveReminder = `- Current \`autoban-active\` is \`${listOption().newOption["autoban-active"]}\`.\n`;
		}
		if (option["log-channel"] === null) {
			logChannelReminder = `- Current \`log-channel\` is \`null\`\nDon't forget to choose a channel for everything to work by using /setup-autoban log-channel\n`;
		} else {
			logChannelReminder = `- Current \`log-channel\` is <#${listOption().newOption["log-channel"]}>\n`;
		}

		reminder = channelReminder + channelActiveReminder + logChannelReminder;


		let change = false;
		let text;
		let o1 = ``, o2 = ``, o3 = ``, o4 = ``, o5 = ``;
		let ftext;
		let f1 = ``, f2 = ``, f3 = ``, f4 = ``, f5 = ``;
		let isError = false;

		if (typeof autoban === "boolean") {
			if (autoban !== option["autoban-active"]) {
				try {
					option["autoban-active"] = autoban;
					change = true;

					o1 = `\`autoban-active\`: \`${listOptionBefore["autoban-active"]}\` => \`${option["autoban-active"]}\`\n`;
				} catch (error) {
					isError = true;
					console.error(error);
				}
			} else {
				f1 = `\`autoban-active\` already \`${autoban}\`\n`;
			}
		}

		if (typeof autobanChannelTarget === "string") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			try {
				let checkThreadChannelTarget = interaction.guild.channels.cache.get(autobanChannelTarget)?.id || interaction.guild.channels.fetch(autobanChannelTarget)?.id || null;
			} catch (error) {
				console.error(error);
				return await interaction.editReply(`Error while fetching channel`);
			}
			if (checkThreadChannelTarget !== null) {
				if (autobanChannelTarget !== option["thread-channel"]) {
					if (autobanChannelTarget !== option["autoban-channel"]) {
						try {
							option["autoban-channel"] = autobanChannelTarget;
							change = true;

							o2 = `\`autoban-channel\`: <#${listOptionBefore["autoban-channel"]}> => <#${option["autoban-channel"]}>\n`;
						} catch (error) {
							isError = true;
							console.error(error);
						}
					} else {
						f2 = `\`autoban-channel\` already <#${autobanChannelTarget}>\n`;
					}
				} else {
					f2 = `\`autoban-channel\` Should not same as \`thread-channel\`'s Channel\nCurrent \`thread-channel\`: <#${listOption().newOption["thread-channel"]}>\n`;
				}
			} else {
				f2 = `There's no Channel ID for\n\`autoban-channel\`: ${autobanChannelTarget}\n`;
			}
		}

		if (typeof removeAutobanChannelTarget === "boolean") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			if (removeAutobanChannelTarget === true && option["autoban-channel"] !== null) {
				try {
					option["autoban-channel"] = null;
					change = true;

					o3 = `\`autoban-channel\`: <#${listOptionBefore["autoban-channel"]}> => <#${option["autoban-channel"]}>\n`;
				} catch (error) {
					isError = true;
					console.error(error);
				}
			}
		}

		if (typeof removeLogChannel === "boolean") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			if (removeLogChannel !== option["log-channel"] && option["log-channel"] !== null) {				try {
					option["log-channel"] = null;
					change = true;

					o5 = `\`log-channel\`: <#${listOptionBefore["log-channel"]}> => \`null\``;
				} catch (error) {
					isError = true;
					console.error(error);
				}
			}
		}

		if (typeof logChannel === "string") {
			try {
				let checkLogChannel = interaction.guild.channels.cache.get(logChannel)?.id || interaction.guild.channels.fetch(logChannel)?.id || null;
			} catch (error) {
				console.error(error);
				return await interaction.editReply(`Error while fetching log channel`);
			}
			if (checkLogChannel !== null) {
				if (logChannel !== option["log-channel"]) {
					try {
						option["log-channel"] = logChannel;
						change = true;

						o4 = `\`log-channel\`: <#${listOptionBefore["log-channel"]}> => <#${option["log-channel"]}>\n`;
					} catch (error) {
						isError = true;
						console.error(error);
					}
				} else {
					f4 = `\`log-channel\` already <#${log-channel}>`;
				}
			} else {
				f4 = `There's no channel ID for\n\`log-channel\`: <#${log-channel}>`;
			}
		}

		text = o1 + o2 + o3 + o4 + o5;
		ftext = f1 + f2 + f3 + f4 + f5;
		let logText;
		let resultText = ``;

		if (isError === true) {
			resultText = `There's an error while executing the interaction.\n`;
		} else {
			resultText = `Interaction Successfully.\n`;
		}

		let commonOption = `\nAuto Ban Channel: <#${listOption().newOption["autoban-channel"]}>\nMedia Thread Channel: <#${listOption().newOption["thread-channel"]}>\nLog Channel: <#${listOption().newOption["log-channel"]}>`;

		if (change === true) {
			fs.writeFileSync(optionsFile, encrypt(JSON.stringify(option)));
			logText = `<@${interaction.user.id}> Updated Auto Ban`;
			const logEmbed = new EmbedBuilder()
				.setColor('008000')
				.setTitle(logText)
				.setDescription(`${text}\nBefore :\n\`${JSON.stringify(listOptionBefore, null, 2)}\`\n\nAfter :\n\`${JSON.stringify(listOption().newOption, null, 2)}\``)
				.setTimestamp();
			if (option["log-channel" !== null]) {
				await channel.get(option["log-channel"]).send({ embeds: [logEmbed] });
			} else {
				await channel.get(interactionChannelID).send ({ embeds: [logEmbed] });

			console.log(`${timer} INFO : Signal ${signal} return completed.`);
			return await interaction.editReply(`${resultText}\n${text}\n${ftext}${commonOption}${status}${reminder}`).catch(console.error);
			}
		}

		const Helper = `Commands :
		\`/setup-autoban\` - print this help commands.
		\`autoban-active\` - controls whether the Auto Ban true/false.
		\`autoban-channel\` - where the place for Auto Ban work.
		\`remove-autoban-channel\` - make the Auto Ban Channel no longer available.
		\`log-channel\` - where the place for bot send logs.
		\`remove-log-channel\` - make the Log Channel no longer available.\n-# Remove does not DELETE any in Discord Server.\n\n`;

		const embed = new EmbedBuilder()
			.setColor('008000')
			.setTitle(`Setup Auto Ban`)
			.setDescription(`${Helper}\`${JSON.stringify(listOption().newOption, null, 2)}\`\n${commonOption}${status}${reminder}`)
			.setTimestamp();

		console.log(`${timer} INFO : Signal ${signal} return completed.`);
		await interaction.editReply(`${resultText}\n${text}\n${ftext}`);
		return await channel.get(interactionChannelID).send({ embeds: [embed] }).catch(console.error);
	}
}

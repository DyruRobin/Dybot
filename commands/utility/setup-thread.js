const { ChannelType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const timer = require('../../timer.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup-thread')
		.setDescription('View only the setup Information.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addBooleanOption((option) =>
			option
				.setName('thread-active')
				.setDescription('Turn ON/OFF thread-channel.'))
		.addChannelOption((option) =>
			option
				.setName('thread-channel')
				.setDescription('Choose channel for thread-channel.')
				.addChannelTypes(ChannelType.GuildText))
		.addBooleanOption((option) =>
			option
				.setName('remove-thread-channel')
				.setDescription("Remove thread-channel's channel (Does Not DELETE the actual channel)"))
		.addChannelOption((option) =>
			option
				.setName('rules-channel')
				.setDescription('Choose Rules Channel. Add or Change the Rules Channel ')
				.addChannelTypes(ChannelType.GuildText))
		.addBooleanOption((option) =>
			option
				.setName('remove-rules-channel')
				.setDescription("Remove Rules Channel for thread-channel's Reminder Message (actual channel will not DELETED)"))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const { encrypt, decrypt } = require('../../fileCrypto');
		await interaction.deferReply({ flags: 64 });
		console.log(`${timer} INFO : Received /setup-thread signal.`);
		const signal = "/setup-thread";

		const interactionChannelID = interaction.channelId;
		const channel = interaction.guild.channels.cache;
		const interactionGuildId = interaction.guildId;
		const thread = interaction.options.getBoolean('thread-active');
		let threadChannelTarget = interaction.options.getChannel('thread-channel')?.id;
		let removeThreadChannelTarget = interaction.options.getBoolean('remove-thread-channel');
		let rulesChannel = interaction.options.getChannel('rules-channel')?.id;
		let removeRulesChannel = interaction.options.getBoolean('remove-rules-channel');

		console.log(`${timer} INFO : Checking received interaction options...`);

		const optionsFile = "./guild/options.json";
		function listOption() {
			let newReadOption = decrypt(fs.readFileSync(optionsFile, "utf8"));
			let newOption = JSON.parse(newReadOption);
			return { newReadOption, newOption };
		}
		const listOptionBefore = listOption().newOption;
		const listReadOptionBefore = listOption().newReadOption;

		if (!fs.existsSync(optionsFile)) {
			logs("CRITICAL", "return failed { ./guild/options.json is missing }.");
			return await interaction.editReply(`\`./guild/options.json\` is **Missing**\nPlease restart the bot`);
		};

		let checkOptions = decrypt(fs.readFileSync(optionsFile, "utf8"));
		let option = JSON.parse(checkOptions);

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
		let text = ``;
		let o1 = ``, o2 = ``, o3 = ``, o4 = ``, o5 = ``;
		let ftext;
		let f1 = ``, f2 = ``, f3 = ``, f4 = ``, f5 = ``;
		let isError = false;

		if (typeof thread === "boolean") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban\n');
			if (thread !== option["thread-active"]) {
				try {
					option["thread-active"] = thread;
					change = true;

					o1 = `\`thread-active\`: \`${listOptionBefore["thread-active"]}\` => \`${option["thread-active"]}\`\n`;
				} catch (error) {
					isError = true;
					console.error(error);
				}
			} else {
				f1 = `\`thread-active\` already \`${thread}\`\n`;
			}
		}

		if (typeof threadChannelTarget === "string") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			try {
				let checkThreadChannelTarget = interaction.guild.channels.cache.get(threadChannelTarget)?.id || interaction.guild.channels.fetch(threadChannelTarget)?.id || null;
			} catch (error) {
				console.error(error);
				return await interaction.editReply(`Error while fetching add channel`);
			}
			if (checkThreadChannelTarget !== null) {
				if (threadChannelTarget !== option["autoban-channel"] && option["autoban-channel"] !== null) {
					if (threadChannelTarget !== option["thread-channel"]) {
						try {
							option["thread-channel"] = threadChannelTarget;
							change = true;

							o2 = `\`thread-channel\`: <#${listOptionBefore["thread-channel"]}> => <#${option["thread-channel"]}>\n`;
						} catch (error) {
							isError = true;
							console.error(error);
						}
					} else {
						f2 = `\`thread-channel\` already <#${threadChannelTarget}>\n`;
					}
				} else {
					f2 = `\`thread-channel\` Should not same as \`autoban-channel\`'s Channel\n\`autoban-channel\`: <#${option["autoban-channel"]}>\n`;
				}
			} else {
				f2 = `There's no Channel ID for\n\`thread-channel\`: <#${threadChannelTarget}>\n`;
			}
		}

		if (typeof removeThreadChannelTarget === "boolean") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			if (removeThreadChannelTarget === true && option["thread-channel"] !== null) {
				try {
					option["thread-channel"] = null;
					change = true;

					o3 = `\`thread-channel\`: <#${listOptionBefore["thread-channel"]}> => \`null\`\n`;
				} catch (error) {
					isError = true;
					console.error(error);
				}
			}
		}

		if (typeof rulesChannel === "string") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			try {
				let checkRulesChannel = interaction.guild.channels.cache.get(rulesChannel)?.id || interaction.guild.channels.fetch(rulesChannel)?.id || null;
			} catch (error) {
				return await interaction.editReply(`Error while fetching rules channel`);
				console.error(error);
			}
			if (checkRulesChannel !== null) {
				if (rulesChannel !== option["rules-channel"]) {
					try {
						option["rules-channel"] = rulesChannel;
						change = true;
						console.log(option["rules-channel"], rulesChannel, checkRulesChannel);
						o4 = `\`rules-channel\`: <#${listOptionBefore["rules-channel"]}> => <#${rulesChannel}>\n`;
					} catch (error) {
						console.error(error);
						isError = true;
					}
				} else {
					f4 = `Rules Channel already <#${rulesChannel}>\n`;
				}
			} else {
				f4 = `There's no channel ID for\n\`add-rules-channel\`: <#${rulesChannel}>\n`;
			}
		}

		if (typeof removeRulesChannel === "boolean") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			if (removeRulesChannel === true && option["rules-channel"] !== null) {
				try {
					option["rules-channel"] = null;
					change = true;

					o5 = `\`rules-channel\`: <#${listOptionBefore["rules-channel"]}> => \`null\`\n`;
				} catch (error) {
					console.error(error);
					isError = true;
				}
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
			logText = `<@${interaction.user.id}> Updated Media Thread`;
			const logEmbed = new EmbedBuilder()
				.setColor('008000')
				.setTitle(logText)
				.setDescription(`${text}\nBefore :\n\`${JSON.stringify(listOptionBefore, null, 2)}\`\n\nAfter :\n\`${JSON.stringify(listOption().newOption, null, 2)}\``)
				.setTimestamp();
			await channel.get(option["log-channel"]).send({ embeds: [logEmbed] }).catch(console.error);

			console.log(`${timer} INFO : Signal ${signal} return completed.`);
			await interaction.editReply(`${resultText}\n${text}\n${ftext}\n\n${commonOption}${status}${reminder}`);
		}

		const Helper = `Commands :
			\`/setup-thread\` - print this help commands.
			\`thread-active\` - controls whether the Media Thread true/false.
			\`thread-channel\` - where the place for Auto Create Thread work.
			\`remove-thread-channel\` - make the Auto Create Thread Channel no longer available.
			\`rules-channel\` - where the place for User know the Rules.
			\`remove-rules-channel\` - make the Rules Channel no longer available.\n-# Remove does not DELETE any in Discord Server.\n\n`

		const embed = new EmbedBuilder()
			.setColor('008000')
			.setTitle(`Setup Media Thread`)
			.setDescription(`${text}\n\`${JSON.stringify(listOption().newOption, null, 2)}\`\n${commonOption}${status}${reminder}`)
			.setTimestamp();

		console.log(`${timer} INFO : Signal ${signal} return completed.`);
		await interaction.editReply(`${resultText}\n${text}\n${ftext}`);
		return await channel.get(interactionChannelID).send({ embeds: [embed] }).catch(console.error);
	}
}

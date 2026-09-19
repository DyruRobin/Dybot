const { ChannelType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const timer = require('../../timer.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('role-whitelist')
		.setDescription('View only the Role Whitelist from Ban Information.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addStringOption((option) =>
			option
				.setName('add-role')
				.setDescription('Add Role to the Auto Ban Whitelist, and will be Immortal in autoban-channel'))
		.addStringOption((option) =>
			option
				.setName('remove-role')
				.setDescription('Remove this Role from the Auto Ban Whitelist, and will not Immortal in autoban-channel.'))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const { encrypt, decrypt } = require('../../fileCrypto');

		await interaction.deferReply({ flags: 64 });
		const signal = "/role-whitelist";
		console.log(`${timer} INFO : Received ${signal} signal.`);

		function logs(notice, text) {
			console.log(timer, notice, ": Signal", signal, text);
			return;
		}

		const interactionChannelID = interaction.channelId;
		const guild = interaction.guildId;
		const channel = interaction.guild.channels.cache;
		let addRole = interaction.options.getString("add-role");
		let removeRole = interaction.options.getString("remove-role");
		
		const whitelistFile = "./guild/role-whitelist.json";
		const guildOptions = "./guild/options.json";

		if (!fs.existsSync(whitelistFile)) {
			console.log(`${timer} CRITICAL : /whitelist.json file is missing.`);
			let a = [];
			console.log(`${timer} WARNING : Creating /whitelist.json.`);
			fs.writeFileSync(whitelistFile, encrypt(JSON.stringify(a)));
		}

		if (!fs.existsSync(whitelistFile)) {
			logs("CRITICAL", "return failed { ./guild/whitelist.json is missing }.");
			return await interaction.editReply(`\`./guild/whitelist.json\` is **Missing**\nPlease restart the bot`);
		};
		if (!fs.existsSync(guildOptions)) {
			logs("CRITICAL", "return failed { ./guild/options.json is missing }.");
			return await interaction.editReply(`\`./guild/options.json\` is **Missing**\nPlease restart the bot`);
		};

		let readWhitelist = decrypt(fs.readFileSync(whitelistFile, "utf8"));
		let readOptions = decrypt(fs.readFileSync(guildOptions, "utf8"));

		let roleCurrent = JSON.parse(readWhitelist);
		let option = JSON.parse(readOptions);

		function list() {
			let newReadRole = decrypt(fs.readFileSync(whitelistFile, "utf8"));
			let newRoleCurrent = JSON.parse(newReadRole);
			let result = "";
			let a = 0;
			for (let r of roleCurrent) {
				a+=1;
				result += a + ". <@&" + r + ">\n";
			};
			return "Role(s) whitelist :\n" + result;
		}
		let listBefore = list();

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

		if (typeof addRole === "string") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			let existsAddRole = interaction.guild.roles.cache.get(addRole)?.id || interaction.guild.roles.fetch(addRole)?.id || null;
			if (existsAddRole !== null) {
				if (roleCurrent.indexOf(addRole) === -1) {
					try {
						roleCurrent.push(addRole);
						change = true;

						o1 = `Added :\n<@&${addRole}>\n\n`;
					} catch (error) {
						console.error(error);
						isError = true;
					}
				} else {
					f1 = `<@&${addRole}> already added.\n`;
				}
			} else {
				f1 = `There's no role ID for\n\`add-role\`: <@&${addRole}>\n`;
			}
		}
		
		if (typeof removeRole === "string") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			let existsRemoveRole = interaction.guild.roles.cache.get(removeRole)?.id || interaction.guild.roles.fetch(removeRole)?.id || null;
			if (existsRemoveRole !== null) {
				let roleHas = roleCurrent.indexOf(removeRole);
				if (roleHas !== -1) {
					try {
						roleCurrent.splice(roleHas, 1);
						change = true;

						o2 = `Removed :\n<@&${removeRole}>\n\n`;
					} catch (error) {
						console.error(error);
						isError = true;
					}
				} else {
					f2 = `There's no <@&${removeRole}> Role in the data to remove.\n`;
				}
			} else {
				f2 = `There's no role ID for\n\`remove-role\`: <@&${removeRole}>\n`;
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
			fs.writeFileSync(whitelistFile, encrypt(JSON.stringify(roleCurrent)));
			logText = `<@${interaction.user.id}> Updated Role Whitelist`;
			const logEmbed = new EmbedBuilder()
				.setColor('008000')
				.setTitle(logText)
				.setDescription(`${text}\nBefore :\n${listBefore}\n\nAfter :\n${list()}`)
				.setTimestamp();
			channel.get(option["log-channel"]).send({ embeds: [logEmbed] }).catch(console.error);

			logs("INFO", "return successfully.");
			return await interaction.editReply(`${resultText}${text}\n${ftext}${status}${reminder}`);
		}

		const embed = new EmbedBuilder()
			.setColor('008000')
			.setTitle('Whitelisted Role From Auto Ban Channel')
			.setDescription(`${text}${list()}${status}${reminder}`)
			.setTimestamp();

		logs("INFO", "return successfully.");
		await interaction.editReply(`${resultText}\n${text}\n${ftext}${status}${reminder}`);
		return await channel.get(interactionChannelID).send({ embeds: [embed] }).catch(console.error);
	}
}

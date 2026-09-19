const { ChannelType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const timer = require('../../timer.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('staff-contact')
		.setDescription('View only the list of Staff Contact')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addUserOption((option) =>
			option
				.setName('add-staff-contact')
				.setDescription('Add staff for banned member to contact.'))
		.addUserOption((option) =>
			option
				.setName('remove-staff-contact')
				.setDescription('Remove staff from availble to contact.'))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const { encrypt, decrypt } = require('../../fileCrypto');

		await interaction.deferReply({ flags: 64 });
		const signal = "/role-thread";
		console.log(`${timer} INFO : Received ${signal} signal.`);

		function logs(notice, text) {
			console.log(timer, notice, ": Signal", signal, text);
			return;
		}

		const interactionChannelID = interaction.channelId;
		const guild = interaction.guildId;
		const channel = interaction.guild.channels.cache;
		let addStaff = interaction.options.getUser('add-staff-contact')?.id;
		let removeStaff = interaction.options.getUser('remove-staff-contact')?.id;

		const staffContactFile = "./guild/staff-contact.json";
		const guildOptions = "./guild/options.json";

		if (!fs.existsSync(staffContactFile)) {
			console.log(`${timer} WARNING : /staff-contact.json file is missing.`);
			let a = [];
			console.log(`${timer} WARNING : Creating /staff-contact.json.`);
			fs.writeFileSync(staffContactFile, encrypt(JSON.stringify(a)));
		}
		
		if (!fs.existsSync(guildOptions)) {
			logs("CRITICAL", "return failed { ./guild/options.json is missing }.");
			return await interaction.editReply(`\`./guild/options.json\` is **Missing**\nPlease restart the bot`);
		};

		let readStaffContact = decrypt(fs.readFileSync(staffContactFile, "utf8"));
		let staffContact = JSON.parse(readStaffContact);

		let readOptions = decrypt(fs.readFileSync(guildOptions, "utf8"));
		let option = JSON.parse(readOptions);

		function list() {
			let newReadStaffContact = decrypt(fs.readFileSync(staffContactFile, "utf8"));
			let newCurrentStaffContact = JSON.parse(newReadStaffContact);
			let result = "";
			let a = 0;
			for (let t of newCurrentStaffContact) {
				a+=1;
				result += a + ". <@" + t + ">\n";
			};
			return "Staff(s) Contact List :\n" + result;
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

		if (typeof addStaff === "string") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			let existsAddStaff = interaction.guild.channels.cache.get(addStaff)?.id || interaction.guild.channels.fetch(addStaff)?.id || null;
			if (existsAddStaff !== null) {
				if (staffContact.indexOf(addStaff) === -1) {
					try {
						staffContact.push(addStaff);
						change = true;

						o1 = `Added :\n<@${addStaff}>\n\n`;
					} catch (error) {
						isError = true;
						console.error(error);
					}
				} else {
					f1 = `<@${addStaff}> already added.\n`;
				}
			} else {
				f1 = `There's no User ID for\n\`add-staff\`: <@${addStaff}>\n`;
			}
		}
		
		if (typeof removeStaff === "string") {
			if (option["log-channel"] === null) return await interaction.editReply('Please at least choose a channel for everything to work by using /setup-autoban log-channel\n');
			let existsRemoveStaff = interaction.guild.channels.cache.get(removeStaff)?.id || interaction.guild.channels.fetch(removeStaff)?.id || null;
			if (existsRemoveStaff !== null) {
				let roleHas = staffContact.indexOf(removeStaff);
				if (roleHas !== -1) {
					try {
						staffContact.splice(roleHas, 1);
						change = true;

						o2 = `Removed :\n<@${removeStaff}>\n\n`;
					} catch (error) {
						isError = true;
						console.error(error);
					}
				} else {
					f2 = `There's no <@${removeStaff}> User in the data to remove.\n`;
				}
			} else {
				f2 = `There's no User ID for\n\`remove-staff\`: <@${removeStaff}>\n`;
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
			fs.writeFileSync(threadFile, encrypt(JSON.stringify(staffContact)));
			logText = `<@${interaction.user.id}> Updated Staff Contact`;
			const logEmbed = new EmbedBuilder()
				.setColor('008000')
				.setTitle(logText)
				.setDescription(`${text}Before :\n${listBefore}\n\nAfter :\n${list()}`)
				.setTimestamp();
			channel.get(option["log-channel"]).send({ embeds: [logEmbed] }).catch(console.error);

			logs("INFO", "return successfully.");
			return await interaction.editReply(`${resultText}${text}\n${ftext}${status}${reminder}`);
		}

		const embed = new EmbedBuilder()
			.setColor('008000')
			.setTitle('Staff Contact')
			.setDescription(`${text}${list()}${status}${reminder}`)
			.setTimestamp();

		logs("INFO", "return successfully.");
		await interaction.editReply(`${resultText}\n${text}\n${ftext}`);
		return await channel.get(interactionChannelID).send({ embeds: [embed] }).catch(console.error);
	}
}

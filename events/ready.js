const { Events } = require('discord.js');
const fs = require('node:fs');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		const { encrypt } = require('../fileCrypto.js');
		//Startup bot options
		const timer = require('../timer.js');
		console.log(`${timer} INFO : Starting...`);
		console.log(`${timer} INFO : Checking resource...`);

		const guildPath = "./guild/";
		const optionsFile = guildPath + "options.json";
		const channelsFile = guildPath + "channels.json";
		const roleThreadFile = guildPath + "role-thread.json";
		const roleWhitelistFile = guildPath + "role-whitelist.json";
		const staffContactFile = guildPath + "staff-contact.json";
		const bannedMemberFile = guildPath + "banned-members.json";
		const checkGuildPath = fs.existsSync(guildPath);
		const checkOptionsFile = fs.existsSync(optionsFile);

		if (!checkGuildPath) {
			console.log(`${timer} WARNING : ./guild/ path is missing.`);
			try {
				console.log(`${timer} WARNING : Creating ./guild/.`);
				fs.mkdirSync(guildPath, ({ recursive: true }));
			} catch (error) {
				console.log(`${timer} CRITICAL : Error while creating ./guild/ folder.`);
				console.error(error);
				return;
			}
			console.log(`${timer} WARNING : ./guild/ path successfuly created.`);
		}

		function newFile(filePath, file) {
			console.log(`${timer} WARNING : ${file}.json file is missing.`);
			try {
				let a = [];
				console.log(`${timer} WARNING : Creating ${file}.json.`);
				fs.writeFileSync(filePath, encrypt(JSON.stringify(a)));
			} catch (error) {
				console.log(`${timer} CRITICAL : Error while creating ${file}.json file.`);
				console.error(error);
			}
			return;
		}

		if (!fs.existsSync(channelsFile)) {
			newFile(channelsFile, "channels");
		}

		if (!fs.existsSync(roleWhitelistFile)) {
			newFile(roleWhitelistFile, "role-whitelist");
		}

		if (!fs.existsSync(staffContactFile)) {
			newFile(staffContactFile, "staff-contact");
		}

		if (!fs.existsSync(roleThreadFile)) {
			newFile(roleThreadFile, "role-thread");
		}
		
		if (!fs.existsSync(bannedMemberFile)) {
			newFile(bannedMemberFile, "banned-members");
		}

		if (!checkOptionsFile) {
			console.log(`${timer} WARNING : /options.json file is missing.`);
			let newRules = null;
			let newLogChannel = null;
			let newAutobanActive = false;
			let newAutobanChannel = null;
			let newThreadActive = false;
			let newThreadChannel = null;
			
			let setNewOptions =	{
				"rules-channel" : newRules,
				"log-channel": newLogChannel,
				"autoban-active": newAutobanActive,
				"autoban-channel": newAutobanChannel,
				"thread-active": newThreadActive,
				"thread-channel": newThreadChannel
			};

			try {
				console.log(`${timer} WARNING : Creating /options.json.`);
				fs.writeFileSync(optionsFile, encrypt(JSON.stringify(setNewOptions)));
			} catch (error) {
				console.log(`${timer} CRITICAL : Error while creating /options.json file.`);
				console.error(error);
				return;
			}
			console.log(`${timer} WARNING : /options.json file successfuly created.`);
		}
		console.log(`${timer} INFO : Checking Completed.`);
		console.log(`${timer} INFO : Client is Ready as ${client.user.tag}.`);
	}
};

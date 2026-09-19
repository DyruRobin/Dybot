const { Guild, Events, GatewayIntentBits, Attachments } = require('discord.js');
const fs = require ('node:fs');

module.exports = async (message) => {
	const { decrypt } = require('../fileCrypto');
	async function threadLock(ms) {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		})
	};

	const guildPath = "./guild/";
	
	const fileOption = guildPath + "options.json";
	let readOption = decrypt(fs.readFileSync(fileOption, "utf8"));
	let option = JSON.parse(readOption);

	const fileRoleThread = guildPath + "role-thread.json";
	if (!fs.existsSync(fileRoleThread) || !option["thread-active"] || !option["thread-channel"]) return;
	let readRoleThread = decrypt(fs.readFileSync(fileRoleThread, "utf8"));
	let roleThread = JSON.parse(readRoleThread);

	const msg = message;
	let mediaThreadChannel = option["thread-channel"]; //media thread channel
	if (msg.channel.id !== mediaThreadChannel) return;

	const hasRole = roleThread.some(r => msg.member.roles.cache.has(r));

	if (hasRole && msg.channel.id === mediaThreadChannel)  {
		if (msg.attachments.size) {
			await msg.startThread({
				autoArchiveDuration: 1440,
				name: "Media Comment",
				rateLimitPerUser: 5,
				reason: "Roles priviledge.",
			});
			if (msg.hasThread) {
				await msg.thread.send(`This thread is created only for a spesific roles and will be locked after 20 hours.\nPlease follow the <#${option["rules-channel"]}>`);
				await threadLock(1_200 * 60_000);
				await msg.thread.setLocked(true);
				if (msg.hasThread) {
					await msg.thread.send("Thread has been locked and will be deleted in 4 hours.");
					await threadLock(240 * 60_000);
					await msg.thread.delete("Thread's already old");
				}
			}
		} else {
			return;
		}
	}
};


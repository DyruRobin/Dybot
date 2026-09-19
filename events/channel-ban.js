const { EmbedBuilder, Message, Events, GatewayIntentBits } = require('discord.js');
const fs = require('node:fs');
const timer = require('../timer.js');

module.exports = async (message) => {
	const { decrypt, encrypt } = require('../fileCrypto');
	const guildPath = "./guild/";
	
	const fileOption = guildPath + "options.json";
	let readOption = decrypt(fs.readFileSync(fileOption, "utf8"));
	let option = JSON.parse(readOption);
	
	const fileChannels = guildPath + "channels.json";
	let readChannels = decrypt(fs.readFileSync(fileChannels, "utf8"));
	let channels = JSON.parse(readChannels);
	
	const fileRoles = guildPath + "role-whitelist.json";
	let readRoles = decrypt(fs.readFileSync(fileRoles, "utf8"));
	let whitelist = JSON.parse(readRoles);

	const fileBannedMember = guildPath + "banned-members.json";
	let readBannedMember = decrypt(fs.readFileSync(fileBannedMember, "utf8"));
	let bannedMember = JSON.parse(readBannedMember);

	let staffContactFile = guildPath + "staff-contact.json";
	let readStaffContact = decrypt(fs.readFileSync(staffContactFile, "utf8"));
	let staffContact = JSON.parse(readStaffContact);
	
	if (!option["autoban-active"] || !option["autoban-channel"] || !option["log-channel"]) return;
	const msg = message;
	let logChannelID = option["log-channel"]; //autoban log channel
	let autobanChannelId = option["autoban-channel"]; //channel for auto ban
	let con;	//content
	let aid;	//author id
	if (msg.channel.id !== autobanChannelId) return;
	let immortal = whitelist.some(item => msg.member.roles.cache.has(item));
	if (msg.channel.id === autobanChannelId && !immortal && !msg.author.bot) {
		try {
			let n = 0; 
			let sentChannel = ``;
			con = msg.content;	//the message on autoban channel
			aid = msg.author.id;	//the author id on autoban channel
			await msg.guild.channels.cache.get(logChannelID).send(`Deleted Message:\n${con}`);
			for (const c of channels) {
				let channel = msg.guild.channels.cache.get(c);
				if (!channel) continue;

				let fetched = await channel.messages.fetch({ limit: 5 });
				
				fetched.forEach(m => {
					//Search and detect the latest 5 message if the user is spam
					if (m.author.id === aid && m.content === con) {
						m.delete().catch(console.error);
						n++;
						sentChannel += "<#" + c + "> ";
					}
				});

				fetched.forEach(m => channel.messages.cache.delete(m.id));
			}

			function list() {
				let newReadStaffContact = decrypt(fs.readFileSync(staffContactFile, "utf8"));
				let newCurrentStaffContact = JSON.parse(newReadStaffContact);
				let result = "";
				let a = 0;
				for (let t of newCurrentStaffContact) {
					a+=1;
					result += a + ". <@" + t + ">\n";
				};
				return result;
			}

			let r = ``;
			let reason1 = `Bot Spam.`;
			let reason2 = `Send Message in <#${option["autoban-channel"]}>.`;
			let logTitle = `🧨 Member Banned.`;
			let dmTitle = `You've been banned from Mortal Company`;

			function emb1(title, desc) {
				const embedCreated1 = new EmbedBuilder()
					.setColor('FF0000')
					.setTitle(title)
					.setDescription(`User: ${msg.author.displayName}\nID: ${msg.author.id}\nReason: ${desc}\n\nSent: ${sentChannel}`)
					.setTimestamp();
				return embedCreated1;
			}

			function emb2(title, desc) {
				const embedCreated2 = new EmbedBuilder()
					.setColor('FF0000')
					.setTitle(title)
					.setDescription(`User: ${msg.author.displayName}\nID: ${msg.author.id}\nReason: ${desc}\n\nSent: ${sentChannel}`)
					.addFields({ name: "Contact Staff(s) :", value: `${list()}`})
					.setTimestamp();
				return embedCreated2;
			}

			let a = new Date();
			let year = a.getFullYear();
			let month = String(a.getMonth()+1).padStart(2,"0");
			let date = a.getDate();
			let newDate = `${date}-${month}-${year}`;

			function storeBannedMember(reason) {
				bannedMemberInfo = {
					[aid]: {
						"id": aid,
						"reason": reason,
						"date": newDate
					}
				}

				return bannedMemberInfo;
			}
			
			if (n>=2) {
				let newBannedMember = storeBannedMember(reason1);
				bannedMember.push(newBannedMember);
				fs.writeFileSync(fileBannedMember, encrypt(JSON.stringify(bannedMember)));
				let logEmbed = emb1(logTitle, reason1);
				let dmEmbed = emb2(dmTitle, reason1);
				let thisDM = await msg.member.createDM();
				await msg.member.send({ embeds: [dmEmbed] });
				await msg.guild.channels.cache.get(logChannelID).send({ embeds: [logEmbed] });
				await msg.member.ban({ deleteMessageSeconds: 3, reason: 'Bot spam.' });
				await thisDM.delete().catch(console.error);
			} else {
				let newBannedMember = storeBannedMember(reason2);
				bannedMember.push(newBannedMember);
				fs.writeFileSync(fileBannedMember, encrypt(JSON.stringify(bannedMember)));
				let logEmbed = emb1(logTitle, reason2);
				let dmEmbed = emb2(dmTitle, reason2);
				let thisDM = await msg.member.createDM();
				await msg.member.send({ embeds: [dmEmbed] });
				await msg.guild.channels.cache.get(logChannelID).send({ embeds: [logEmbed] });
				await msg.member.ban({ deleteMessageSeconds: 3, reason: 'Sent in autoban channel' });
				await thisDM.delete().catch(console.error);
			}
			console.log(timer, "Member Banned Detected.")

		} catch (error) {
			console.error(error);
		}
	} else {
		console.log(timer, "whitelisted or something error - ");
	}
};

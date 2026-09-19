const { Events, ActivityType } = require('discord.js');

module.exports = {
	name: Events.ClientReady,

	async execute(client) {
		setInterval(() => {
			client.user.setPresence({ 
				status: 'online',
				activities: [
					{
						name: 'Mortal Company Mobile',
						type: ActivityType.Playing,
						state: 'Available on Play Store!',
					},
				],
			});
		}, 30_000);
	}
}

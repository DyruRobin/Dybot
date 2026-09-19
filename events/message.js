const { Events } = require('discord.js');

const handlers = [
	require('./media-thread.js'),
	require('./channel-ban.js'),
];

module.exports = {
	name: Events.MessageCreate,

	async execute(message) {
		if (message.author.bot) return;

		for (const handler of handlers) {
			handler(message);
		}
	}
};

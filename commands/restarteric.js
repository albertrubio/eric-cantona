module.exports = {
	name: 'restarteric',
	description: 'Restart the Bot',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		if (message.author.id !== '688832120910774317') {
			message.channel.send('who the fuck are you!').then(() => {
				return;
			});
		}
		else {
			message.channel.send('Resetting Eric..');
		}
	},
};


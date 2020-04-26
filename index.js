const fs = require('fs');

// require the discord.js module
const Discord = require('discord.js');

// include config
const { prefix, token, botVersion } = require('./config.json');

// create a new Discord client
const client = new Discord.Client();

// const channel = new Discord.Channel();

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

// database Creation

const sqlite3 = require('sqlite3').verbose();


// open the database
const myDB = new sqlite3.Database('./data/eric-cantona.sqlite3',
	sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
	(err) => {
		if (err) {console.error(err.message);}
		else {console.log('Connected to the Eric Cantona database.');}
	});

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log(`Im Eric.Cantona Bot! \n Version: ${botVersion}`);
	myDB.run('CREATE TABLE IF NOT EXISTS linksHistory (idLink INTEGER PRIMARY KEY autoincrement, urlValue BLOB NOT NULL, userID TEXT NOT NULL,channelID TEXT NOT NULL, timestamp TEXT NOT NULL)');
	myDB.run('CREATE TABLE IF NOT EXISTS goals (idGoal INTEGER PRIMARY KEY autoincrement, value INTEGER NOT NULL, userID TEXT NOT NULL, idLink TEXT NOT NULL, timestamp TEXT NOT NULL, username TEXT NOT NULL)');
});

function containsUrl(string) {
	/* if(/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(string)) {return true;}
	else {return false;} */

	// if(new RegExp('([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?').test(string)) return true;
	return string.match(/\bhttps?:\/\/\S+/gi);
}

Date.prototype.getFullMinutes = function() {
	if (this.getMinutes() < 10) {
		return '0' + this.getMinutes();
	}
	return this.getMinutes();
};

// event on message
client.on('message', message => {

	if (!message.content.startsWith(prefix) || message.author.bot) {

		if (containsUrl(message.content)) {
			const onlyUrl = containsUrl(message.content).toString()
			const sqlGetLink = 'SELECT * FROM linksHistory WHERE urlValue = ?';
			const sqlInsertLink = 'INSERT INTO linksHistory (urlValue, userID, channelID, timestamp) VALUES (?, ?, ?, ?)';
			const sqlInsertGoal = 'INSERT INTO goals (value, userID, idLink, timestamp, username) VALUES (?, ?, ?, ?, ?)';
			const today = new Date();
			const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			const time = today.getHours() + ':' + today.getFullMinutes() + ':' + today.getSeconds();
			const currentTime = date + ' ' + time;
			console.log(`ONLYURL = ${onlyUrl}`);
			myDB.get(sqlGetLink, onlyUrl, (err, row) => {
				// If row not found, create it
				if (err) {
					return console.error(err.message);
				}
				else if (!row) {
					console.log(onlyUrl);
					myDB.run(sqlInsertLink, [onlyUrl, message.author.id, message.channel.id, currentTime.toString()], function(err) {
						if (err) {return console.error(err.message);}
						console.log(`Created new row for new link ${onlyUrl} by ${message.author.id}. (${message.author.username}) `);
					});
				}
				else {
					
					if(message.author.id === row.userID)
					{
						console.log(`Link ${onlyUrl} already inserted by same user. Dont create goal`);
						return;
					}
					else if (message.channel._typing.size > 0 ){
						console.log(`Link ${onlyUrl} quoted. Dont create goal`);
						return;
					}
					else{
						console.log(`Link ${onlyUrl} exists . Creating Goal Insert`);
						myDB.run(sqlInsertGoal, [1, message.author.id, row.idLink, currentTime.toString(), message.author.username], function(err) {
							if (err) {return console.error(err.message);}
							console.log(`Created new row for new Goal : ${row.idLink} -> ${row.urlValue} -> ${row.userID}  ->  ${row.channelID} ->  ${row.timestamp}`);
							// return a Message to the user in Channel
							message.reply('GOOOOOOOOOOOOOOOOOOOOOL!').then(() => console.log(`Sent a reply to ${message.author.username}`))
								.catch(console.error);
						},
						);
					}
					
				}

			});

		}
		/*
		channel.messages.fetch({ limit: 10 })
			.then(messages => console.log(`Received ${messages.size} messages`))
			.catch(console.error);
		*/
	}
	else{
		const args = message.content.slice(prefix.length).split(/ +/);
		const commandName = args.shift().toLowerCase();

		const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) return;

		if (command.guildOnly && message.channel.type !== 'text') {
			return message.reply('I can\'t execute that command inside DMs!');
		}

		if (command.args && !args.length) {
			let reply = `You didn't provide any arguments, ${message.author}!`;

			if (command.usage) {
				reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
			}

			return message.channel.send(reply);
		}

		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Discord.Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.name);
		const cooldownAmount = (command.cooldown || 3) * 1000;

		if (timestamps.has(message.author.id)) {
			const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
			}
		}

		timestamps.set(message.author.id, now);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

		try {
			command.execute(message, myDB);
		}
		catch (error) {
			console.error(error);
			message.reply('there was an error trying to execute that command!');
		}
	}
});


// login to Discord with your app's token
client.login(token);
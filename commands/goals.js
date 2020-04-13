module.exports = {
	name: 'goals',
	description: 'Show how many goals for each User',
	execute(message, myDB) {
		const getGoalsByUser = 'SELECT SUM(VALUE) as Goals from goals where userID = ?';
		myDB.get(getGoalsByUser, message.author.id, (err, row) => {
			if (err) {
				return console.error(err.message);
			}
			else{
				console.log(row);
				if(row.Goals === null) message.channel.send(`${message.author.username} hasn't scored any goal`);
				else message.channel.send(`${message.author.username} has scored ${row.Goals} goal(s)`);
			}
		});

	},
};
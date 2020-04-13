module.exports = {
	name: 'rank',
	description: 'Show Goals Ranking',
	execute(message, myDB) {
		const getRanking = 'SELECT userID,username,sum(value) as Goals from goals group by userID,username order by sum(value) desc';
		myDB.all(getRanking, (err, rows) => {
			if (err) {
				return console.error(err.message);
			}
			else if (!rows) {
				message.channel.send('No goals Yet');
			}
			else{
				console.log(rows);
				message.channel.send(' Goal Ranking');
				message.channel.send('------------------------------------');
				rows.forEach((row) => {
					message.channel.send(`${row.username} :  ${row.Goals} goal(s)`);
				},
				);
			}
		});

	},
};
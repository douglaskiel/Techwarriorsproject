var Sequelize = require('sequelize');
var sequelize = new Sequelize('temp', 'postgres', 'postgres', {
		dialect: 'postgres'
		// dialectOptions: {
		// 	ssl: {
		// 		require: true
		// 	}
		// }
	});

module.exports = sequelize;

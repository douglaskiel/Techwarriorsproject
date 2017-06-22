var Sequelize = require('sequelize');
var sequelize = new Sequelize('temp', 'postgres', 'postgres', {
		dialect: 'postgres'
	});

module.exports = sequelize;

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var db = require('./server/database/database');
var jwt = require('jsonwebtoken');

process.env.SECRET = "subscribe to techwarriorz on youtube";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/client', express.static(__dirname + '/client'))

//Controllers
var userController = require('./server/controllers/user-controller');

//Routes
app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
})

app.post('/api/user/create', userController.createUser);
app.post('/api/user/login', userController.logIn);


var PORT = process.env.PORT || 3000;

db.sync()
	.then(function() {
		app.listen(PORT, function() {
			console.log("Abby calling! " + PORT);
		});
	});
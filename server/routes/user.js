var express = require('express');
var router = express.Router();
var db = require('../database/database');
var bodyParser = require('body-parser');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

// POST ENDPOINTS
router.post('/request_friend', function(req, res) {
	// Check to see if a request ahs already been sent... OR if they are already friends
	var query = "SELECT * FROM user_friend_requests WHERE sender_id=" 
	+ req.user_id + " AND received_id=" + req.body.received_id;

	db.query(query).spread(function(result, metadata) {
		if (result.length === 0) {
			insertRequest();
		}
	}).catch(function(err) {
		res.status(500).send(err);
	});

	function insertRequest() {
		var query = "INSERT INTO user_friend_requests (sender_id, received_id, status) VALUES(" 
		+ req.body.sender_id + "," + req.body.received_id + ",'pending')";

		db.query(query).spread(function(result, metadata) {
			res.status(200).send ("Friend Request Created Successfully.")
		}).catch(function(err) {
			res.status(500).send(err)
		})
	}

});
router.post('/request_friend_respond', function(req, res) {
	// Check to see if the Request even exists
	var query = "SELECT * FROM user_friend_requests WHERE id=" 
	+ req.body.request_id;
	var senderId;
	var receivedId;

	db.query(query).spread(function(result, metadata){
		if (result.length > 0) {
			senderId = result[0].sender_id;
			receivedId = result[0].received_id;
			updateRequest();
			// update accordingly
		} else {
			res.status(400).send("Request Doesn't Exist")
		}
	});

	// This is the updating of the friend request for accepting or denying
	// Vid.2 Min 58:45 - When updating now you have to perform two inserts 
	// of the user into the postgres database user_friend_requests which
	// will avoid a bunch of ugly code
	function updateRequest() {
		var isAccepted = req.body.confirmation === 'confirmed';
		var query;

		if (isAccepted) {
			query = "UPDATE user_friend_requests SET status='confirmed' WHERE id=" + req.body.request_id;
		} else {
			query = "DELETE FROM user_friend_requests WHERE id=" + req.body.request_id;
		}

		db.query(query).spread(function() {
			if (isAccepted) {
				performSenderInsert();
			} else {
				// Vid.2 Min 58:00 This is to assure the other person that everything is alright 
				// after having been deleted, and that row will be deleted from the database
				res.status(200).send("We have successfully deleted the request")
			}
		}).catch(function() {
			res.status(400).send("Unable to process Update to User_Friend_Requests at this time.")
		})
	}

	function performSenderInsert() {
		var query = "INSERT INTO user_friends (user_id, friend_id, date_friended) VALUES (" 
		+ senderId + ", " + receivedId + ", now())";

		db.query(query).spread(function() {
			performReceiverInsert();
		}).catch(function() {
			res.status(500).send("Unable to send a friend request at this time.")
		})
	}

	function performReceiverInsert() {
		var query = "INSERT INTO user_friends (user_id, friend_id, date_friended) VALUES (" 
		+ receivedId + ", " + senderId + ", now())";

		db.query(query).spread(function() {
			res.status(200).send("The user was successfully confirmed")
		}).catch(function() {
			res.status(500).send("Unable to send a friend request at this time.")
		})
	}
	
});

module.exports = router;
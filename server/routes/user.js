var express = require('express');
var router = express.Router();
var db = require('../database/database');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

router.use(function(req, res, next) {
	var token = req.headers['auth-token'];
		jwt.verify(token, process.env.SECRET, function(err, decoded) {
			if (err) {
				res.status(400).send("The token is invalid")
			} else {
				// Vid.2 Hr 1:32:44 - This is to check if the decoded data will push through
				// Vid.2 Hr 1:32:51 - We don't want the user to pass in as a parameter, 
				// but we do want the token. this way we can check id and see the 
				// token and use it from there. 
				console.log(decoded.id);
				next();
			}
		})
});

// GET ENDPOINTS
router.get('/get_friends', function(req, res)  {
	var query = "SELECT * FROM user_friends WHERE user_id=" + req.query.user_id;
	db.query(query).spread(function(result, metadata) {
		res.json({
			data: result
		});
	}).catch(function(err) {
		res.status(500).send(err);
	})
});

router.get('/get_friend_requests', function(req, res) {
	// This will send the users or database all the received_id information.
	var query = "SELECT * FROM user_friend_requests WHERE received_id=" + 
	req.query.user_id + "AND status='pending'";

	db.query(query).spread(function(result, metadata) {
		res.json({
			data: result
		})
	}).catch(function(err){
		res.status(500).send("Unable to get friend requests at this time.")
	});	
})

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
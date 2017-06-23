var db = require('../database/database');
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(7);
var jwt = require('jsonwebtoken');

module.exports.createUser = function(req, res) {
	var password = bcrypt.hashSync(req.body.user_password, salt);
	console.log(password);
	var query = "INSERT INTO users (username, user_password, email) VALUES ('" + 
	req.body.username + "', '" + password + "', '" + req.body.email + "')";

	db.query(query).spread(function(result, metadata){
		res.status(200).send("User was successfully created.");
	}).catch(function(err){
		res.status(500).send("User was not created Abby!");
	})
}

module.exports.logIn = function(req, res) {
	// Vid.1 Min 47:14 - The submitted password is that which is given from the
	// frontend by the user.
	// Vid.1 Min 57:37 - He finally decides that the bcrypt.hashSync and salt is 
	// unnecessary leaving req.body.password, but on this more modern version
	// it works well.
	var submittedPassword = req.body.password;
	// Vid.1 Min 47:28 - Then, selecting the user data, and will compare the 
	// hashes that are sent through the encryption process
	var query = "SELECT * FROM users WHERE username='" + req.body.loginName + 
	"' OR email='" + req.body.loginName + "'";
	// Vid.1 Min 47:50 - Takes the information and passes an array of 
	// data which should only be one thing
	db.query(query).spread(function(result, metadata) {
		// Vid.1 Min 47:55-48:15 - If the data passes an array of 0 then 
		// it will pass the data into the variable called userData, 
		// which in turn passes that into the isVerified variable
		// letting bcrypt compare hashes to see if they work together in harmony
		if (result.length > 0) {
			var userData = result[0];
			// In the isVerified variable the submitted password must be called first
			// then the userData.user_password
			var isVerified = bcrypt.compareSync(submittedPassword, 
				userData.user_password);

			// Vid.1 Min 54:10 - He goes through and checks and calls the password 
			// on the console to find out where the problem is by calling 

									// res.json({
									// 	newPW: submittedPassword,
									// 	userData.user_password,
									// 	isVerified: isVerified
									// })

			// Vid.1 Min 56:55 - He also looks on the bcryptjs to look for answers.

				// User authenticated... Give them a token
				// Vid.1 Hr 1:10:33 - When he is confused about not making the 
				// "env" lowercase.  He tests with different variables with queries
				// using sql syntax.  Then he erases it all, and starts over.
				var token = jwt.sign(userData, process.env.SECRET, {
					expiresIn : 60*60*24
				})


				if (isVerified){
          // Vid.1 Hr 1:53:33 - this is to keep peoples password safe from identity theft.
          delete userData.user_password;
          res.json({
            userData: userData,
            token: token
          })
        } else {
          res.status(400).send("Password doesn't comply, Sir!");
        }
      }
      
  }).catch(function(err){
    res.status(500).send("Unable to process the query.");
  })
}
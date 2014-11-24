var express = require('express');
var router = express.Router();
var User = require('../db/User');
var _ = require('underscore');

function getPublicUser(user) {
	publicUser = {
		id: user._id,
		firstname: user.firstname,
		email: user.email,
		roles: user.roles,
		phone: user.phone,
		locations: user.locations,
		userNotes: user.userNotes,
		company: user.company,
		created: user.created,
		emailEnabled: user.emailEnabled,
		emailVerified: user.emailVerified,
	};

	// TODO LOCATIONS

	return publicUser;
}

function getErrorObj(err) {
	return {
		message: err.message,
		errors: _.pluck(err.errors, 'message')
	}
}

/* POST new user */
router.post('/', function(req, res) {
	var user = new User();
	var userData = req.body.user;

	if(!userData)
	{
		res.status(400).send({ message: "No user sent "});
		return;
	}

	user.firstname = userData.firstname;
	user.lastname = userData.lastname;
	user.email = userData.email;
	user.roles = userData.roles;
	user.phone = userData.phone;
	user.passwordHash = userData.passwordHash;
	user.userNotes = userData.userNotes;
	user.company = userData.company;
	user.emailEnabled = userData.emailEnabled;
	user.emailVerified = userData.emailVerified;

	// TODO LOCATIONS

	user.save(function (err, product) {
		if(err)
		{
			res.status(400).send(getErrorObj(err));
			return;
		}

		res.status(201).send({
			users: [getPublicUser(product)] 
		});
	});
});

/* GET users listing. */
router.get('/', function(req, res) {
	var limit = req.query['limit'] || 20;
	var offset = req.query['offset'] || 0;

	User.find({ }, null, { skip: offset, limit: limit }, function (err, users) {
		if(err)
		{
			res.status(400).send(getErrorObj(err));
			return;
		}

		users = _.map(users, function(user) {
			return getPublicUser(user);
		});

		res.send({
			users: users
		});
	});
});



module.exports = router;

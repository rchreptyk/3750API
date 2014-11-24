var express = require('express');
var router = express.Router();
var User = require('../db/User');
var _ = require('underscore');

function getPublicUser(user) {
	
	var allowedEntries = [
		'firstname', 
		'lastname', 
		'email',
		'roles',
		'phone',
		'locations',
		'userNotes',
		'company',
		'created',
		'emailEnabled',
		'emailVerified'
	];

	var publicUser = _.pick(user, allowedEntries);
	publicUser.id = user._id;

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

/* GET users listing. */
router.get('/:id', function(req, res) {
	var id = req.params['id'];

	User.findById(id, function (err, user) {
		if(err)
		{
			res.status(400).send(getErrorObj(err));
			return;
		}

		if(user)
		{
			res.send({
				users: [getPublicUser(user)]
			});
		}
		else
		{
			res.status(404).send({
				message: "Could not find user with the given id"
			});
		}
	});
});

/* GET a user. */
router.get('/:id', function(req, res) {
	var id = req.params['id'];

	User.findById(id, function (err, user) {
		if(err)
		{
			res.status(400).send(getErrorObj(err));
			return;
		}

		if(user)
		{
			res.send({
				users: [getPublicUser(user)]
			});
		}
		else
		{
			res.status(404).send({
				message: "Could not find user with the given id"
			});
		}
	});
});

router.put('/:id', function(req, res){
	var id = req.params['id'];

	var updateable = [
		'firstname', 
		'lastname',
		'phone',
		'roles',
		'userNotes',
		'company',
		'emailEnabled',
		'emailVerified'
	];

	if(!req.body.user)
	{
		req.status(400).send({ message: "No user information given "});
	}

	var fields = _.pick(req.body.user, updateable);

	User.findById(id, function(err, user) {
		if(err)
		{
			res.status(400).send(getErrorObj(err));
			return;
		}

		if(!user)
		{
			res.status(404).send({
				message: "Could not find user with the given id"
			});
			return;
		}

		_.extend(user, fields);

		user.save(function( err, resultUser, numberAffected) {

			if(err)
			{
				res.status(400).send(getErrorObj(err));
				return;
			}

			res.send({
				users: [getPublicUser(resultUser)]
			});
		});

	});
});


module.exports = router;

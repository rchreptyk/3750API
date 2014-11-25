var express = require('express');
var router = express.Router();

var _ = require('underscore');
var Q = require('q');

var User = require('../db/user');
var Location = require('../db/location');

var auth = require('../db/auth');

var getErrorObj = require('../errors').getErrorObj;

var pub = require('../public');
var getPublicUser = pub.getPublicUser;
var getPublicLocations = pub.getPublicLocations;

function saveLocation(user, locationData) {
	var deferred = Q.defer();

	location = new Location();
	location.description = locationData.description;
	location.address1 = locationData.address1;
	location.address2 = locationData.address2;
	location.city = locationData.city;
	location.postal = locationData.postal;
	location.country = locationData.country;
	location.latitude = locationData.latitude;
	location.longitude = locationData.longitude;

	location.save(function(err, product) {
		if(err)
		{
			deferred.reject(new Error(err ));
			return;
		}

		user.locations.push(product._id);
		deferred.resolve(product);
	});

	return deferred.promise;
}

/* POST new user */
router.post('/', function(req, res) {
	var userObj = new User();
	var userData = req.body.user;

	if(!userData)
	{
		res.status(400).send({ message: "No user sent "});
		return;
	}

	userObj.firstname = userData.firstname;
	userObj.lastname = userData.lastname;
	userObj.email = userData.email;
	userObj.roles = userData.roles;
	userObj.phone = userData.phone;
	userObj.passwordHash = userData.passwordHash;
	userObj.userNotes = userData.userNotes;
	userObj.company = userData.company;
	userObj.emailEnabled = userData.emailEnabled;
	userObj.emailVerified = userData.emailVerified;

	var checks = [];

	var uniqueEmail = Q.Promise(function(resolve, reject) {
		User.where({ email: userObj.email }).count(function(err, count) {
			if(err)
				reject();
			else if(count != 0)
				reject({
					message: 'A user already exists with that email'
				});
			else
				resolve();
		});
	});

	checks.push(uniqueEmail);

	if(userData.locations)
	{
		userData.locations.forEach(function(locationData) {
			checks.push(saveLocation(userObj, locationData));
		});
	}

	Q.all(checks).then(function(locations) {
		userObj.save(function (err, product) {
			if(err)
			{
				console.log(err);
				res.status(400).send(getErrorObj(err));
				return;
			}

			User.populate(product, { path: 'locations' }, function(err, populatedUser) {

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
	}).catch(function (err) {
		res.status(400).send(getErrorObj(err));
	});
});

/* GET users listing. */
router.get('/', function(req, res) {
	var limit = req.query['limit'] || 20;
	var offset = req.query['offset'] || 0;

	User.find({ }, null, { skip: offset, limit: limit }).populate('locations').exec(function (err, users) {
		if(err)
		{
			console.log(err);
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

/* GET a user. */
router.get('/:id', function(req, res) {
	var id = req.params['id'];

	User.findById(id).populate('locations').exec(function (err, user) {

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

	User.findById(id).populate('locations').exec(function(err, user) {
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
				users: [getPublicUser(user)]
			});

		});

	});
});

router.delete('/:id', function(req, res) {
	var id = req.params['id'];

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

		user.remove(function(err) {

			if(err)
			{
				res.status(500).send(getErrorObj(err));
			}
			else
			{
				res.send({
					message: "User deleted"
				});
			}
		});
	});
});

router.get('/:userid/locations', function (req, res) {

	var userid = req.params['userid'];

	User.findById(userid).populate('locations').exec(function(err, user) {
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

		res.send({
			locations: getPublicLocations(user.locations)
		});

	});

});

router.post('/:userid/locations', function (req, res) {

	var userid = req.params['userid'];

	if(!req.body.location)
	{
		res.status(400).send({
			message: "No location was sent"
		});
		return;
	}

	User.findById(userid).populate('locations').exec(function(err, user) {
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

		locSave = saveLocation(user, req.body.location);

		locSave.then(function (location) {
			user.save(function( err, resultUser ) {

				if(err)
				{
					res.status(400).send(getErrorObj(err));
					return;
				}

				res.status(201).send({
					locations: getPublicLocations([location])
				});

			});

		}).catch(function (err) {
			res.status(400).send(getErrorObj(err));
		});
		

	});

});

router.get('/:userid/locations', function (req, res) {

	var userid = req.params['userid'];

	User.findById(userid).populate('locations').exec(function(err, user) {
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

		res.send({
			locations: getPublicLocations(user.locations)
		});

	});

});

router.get('/:userid/locations/:locationid', function (req, res) {
	var userid = req.params['userid'];
	var locationid = req.params['locationid'];

	User
	.findById(userid)
	.populate({
		path: 'locations', 
		match: { _id: locationid }}
	)
	.exec(function(err, user) {
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

		if(user.locations.length != 1)
		{
			res.status(404).send({
				message: "Could not find location with the given id"
			});
			return;
		}

		res.send({
			locations: getPublicLocations(user.locations)
		});
	});
});

router.put('/:userid/locations/:locationid', function (req, res) {
	var userid = req.params['userid'];
	var locationid = req.params['locationid'];

	var entries = _.without(allowedLocationEntries, 'id');

	if(!req.body.location)
	{
		res.status(400).send({
			message: "No location was sent"
		});
		return;
	}

	User
	.findById(userid)
	.populate({
		path: 'locations', 
		match: { _id: locationid }}
	)
	.exec(function(err, user) {
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

		if(user.locations.length != 1)
		{
			res.status(404).send({
				message: "Could not find location with the given id"
			});
			return;
		}

		var location = user.locations[0];

		var locationData = _.pick(req.body.location, entries);

		_.extend(location, locationData);

		location.save(function (err, product) {
			if(err)
			{
				res.status(400).send(getErrorObj(err));
				return;
			}

			res.send({
				locations: getPublicLocations([product])
			});
		});
	});
});

router.delete('/:userid/locations/:locationid', function (req, res) {
	var userid = req.params['userid'];
	var locationid = req.params['locationid'];

	User
	.findById(userid)
	.populate('locations')
	.exec(function(err, user) {
		if(err) {
			res.status(400).send(getErrorObj(err));
			return;
		}

		if(!user) {
			res.status(404).send({
				message: "Could not find user with the given id"
			});
			return;
		}

		var locationToRemove = null;

		for(var i =0; i < user.locations.length; i++) {
			if(user.locations[i]._id == locationid) {
				locationToRemove = user.locations[i];
				user.locations.splice(i, 1);
				break;
			}
		}

		if(locationToRemove == null)
		{
			res.status(404).send({
				message: "Could not find location with the given id"
			});
			return;
		}

		user.save(function(err) {
			if(err) {
				res.status(500).send(getErrorObj(err));
				return;
			}

			locationToRemove.remove(function(err) {
				if(err) {
					res.status(500).send(getErrorObj(err));
				} else {
					res.send({
						message: "Location deleted"
					});
				}
			});
		});

	});
});

router.post('/authenticate', function (req, res) {
	var email = req.body.email;
	var passwordHash = req.body.passwordHash;

	if(typeof email != 'string' || typeof passwordHash != 'string')
	{
		res.status(403).send({
			message: "Authentication failed"
		});
	}

	User.findOne({email: email}).populate('locations').exec(function(err, aUser) {
		if(err){
			res.status(500).message(getErrorObj(err));
			return;
		}

		if(!aUser) {
			res.status(403).send({
				message: "Authentication failed"
			});
			return;
		}

		if(aUser.passwordHash != passwordHash) {
			res.status(403).send({
				message: "Authentication failed"
			});
			return;
		}

		auth.generateToken(aUser).then(function(token) {
			res.send({
				token: token,
				user: getPublicUser(aUser)
			});
		}).fail(function(err){
			res.status(500).message(getErrorObj(err));
		})
	});
});

module.exports = router;

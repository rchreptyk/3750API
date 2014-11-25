var express = require('express');
var router = express.Router();
var User = require('../db/user');
var Location = require('../db/location');
var _ = require('underscore');
var objectID = require('../db/db').Types.ObjectId;
var Q = require('q');

function getPublicUser(user) {
	
	var allowedEntries = [
		'id', 
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

	user.id = user._id;
	var publicUser = _.pick(user, allowedEntries);
	
	publicUser.locations = getPublicLocations(publicUser.locations);

	return publicUser;
}

function getPublicLocations(locations) {
	var allowedLocationEntries = [
		"id",
		"description",
		"address1",
		"address2",
		"city",
		"postal",
		"country",
		"longitude",
		"latitude"
	];

	locations = _.map(locations, function(location) {
		location.id = location._id;
		location = _.pick(location, allowedLocationEntries);

		return location;
	});

	return locations;
}

function getErrorObj(err) {
	return {
		message: err.message,
		errors: _.pluck(err.errors, 'message')
	}
}

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

	console.log("Saving...");

	location.save(function(err, product) {
		if(err)
		{
			console.log(err);
			res.status(400).send(getErrorObj(err));
			failed = true;
			console.log("Failed...");
			deferred.reject(new Error(error));
			return;
		}

		user.locations.push(product._id);
		deferred.resolve(product);
	});

	return deferred.promise;
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

	var locationSaves = [];

	if(userData.locations)
	{
		userData.locations.forEach(function(locationData) {
			console.log("Starting save");
			console.log(locationData);
			locationSaves.push(saveLocation(user, locationData));
		});
	}

	
	console.log("Waiting");
	Q.all(locationSaves).then(function(locations) {

		

		user.save(function (err, product) {
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
	});
});

/* GET users listing. */
router.get('/', function(req, res) {
	var limit = req.query['limit'] || 20;
	var offset = req.query['offset'] || 0;

	User.find({ }, null, { skip: offset, limit: limit }, function (err, users) {
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
		
		console.log(user);

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

module.exports = router;

/* Methods for getting publicly shown version of model objects */

var _ = require('underscore');

/* The allowed fields for locations */
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

/* The allowed fields for users */
var allowedUserEntries = [
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

/* The allowed fields for events */
var allowedEventEntries = [
	'id',
	'owner',
	'description',
	'location',
	'trees',
	'datetime',
	'endtime',
	'status',
	'attendees',
	'staffNotes',
	'created'
];

/* Allowed fields for trees */
var allowedTreeEntries = [
	'type',
	'quantity'
];

/* Get a public object for an event */
module.exports.getPublicEvent = function(event) {
	event.id = event._id;

	var publicEvent = _.pick(event, allowedEventEntries);
	publicEvent.owner = getPublicUser(publicEvent.owner);
	publicEvent.location = getPublicLocation(publicEvent.location);
	publicEvent.attendees = _.map(publicEvent.attendees, getPublicUser);

	publicEvent.trees = _.map(publicEvent.trees, function(tree) {
		return _.pick(tree, allowedTreeEntries);
	});

	return publicEvent;
}

/* Get a public object for a user */
function getPublicUser(user) {

	if(!user)
		return user;

	user.id = user._id;
	var publicUser = _.pick(user, allowedUserEntries);
	
	publicUser.locations = getPublicLocations(publicUser.locations);

	return publicUser;
}
module.exports.getPublicUser = getPublicUser;

/* Get a public object for a location */
function getPublicLocation(location) {

	if(!location)
		return location;

	location.id = location._id;
	location = _.pick(location, allowedLocationEntries);

	return location;
}

/* Get public objects for a list of locations */
function getPublicLocations(locations) {

	if(!locations)
		return locations;

	locations = _.map(locations, getPublicLocation);
	return locations;
}

module.exports.getPublicLocations = getPublicLocations;
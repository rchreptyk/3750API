
var _ = require('underscore');

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

var allowedTreeEntries = [
	'type',
	'quantity'
];

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

function getPublicUser(user) {
	user.id = user._id;
	var publicUser = _.pick(user, allowedUserEntries);
	
	publicUser.locations = getPublicLocations(publicUser.locations);

	return publicUser;
}
module.exports.getPublicUser = getPublicUser;

function getPublicLocation(location) {
	location.id = location._id;
	location = _.pick(location, allowedLocationEntries);

	return location;
}

function getPublicLocations(locations) {
	locations = _.map(locations, getPublicLocation);
	return locations;
}

module.exports.getPublicLocations = getPublicLocations;
/* The mongoose model for Locations */
var settings = require('../db/settings');
var db = require('../db/db');

var Q = require('q');

var Schema = db.Schema;

var locationSchema = new Schema({
	_id: {type: Number},
	description: {type: String, default: ""},
	address1: {type: String, required: true},
	address2: {type: String, default: ""},
	city: {type: String, required: true},
	postal: {type: String, required: true},
	country: { type: String, default: "Canada"},
	latitude: String,
	longitude: String
});

locationSchema.pre('save', function(next) {
	var location = this;

	if(!this.isNew)
	{
		next();
		return;
	}

	settings.Settings.findByIdAndUpdate( settings.SettingsKey, { $inc: { nextSeqNumber: 1 } }, function(err, settingObj) {
		if(err) next(err);

		location._id = settingObj.nextSeqNumber - 1;
		next();
	});
});

var Location = db.model('Location', locationSchema);

/* Add an exists method on the Location model */
Location.exists = function(id) {
	
	var deferred = Q.defer();

	Location.findById(id, function(err, obj) {
		if(err)
		{
			deferred.reject(err)
			return;
		}

		if(!obj)
		{
			deferred.reject({
				message: "Location of id " + id + " does not exist"
			});
		}

		deferred.resolve();
	});

	return deferred.promise;
};

module.exports = Location;
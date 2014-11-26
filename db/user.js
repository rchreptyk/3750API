/*
Module specification for a user.
*/

var settings = require('../db/settings');
var db = require('../db/db');

var Q = require('q');

var Location = require('../db/location')

var Schema = db.Schema;

var userSchema = new Schema({
	_id: {type: Number},
	firstname: {type: String, required: true},
	lastname: {type: String, required: true},
	email: {type: String, required: true, index: { unique: true }},
	roles: {type: [String], default: ["Normal"] },
	passwordHash: { type: String, required: true },
	phone: Number,
	locations: [ { type: Number, ref: 'Location' }],
	userNotes: { type: String, default: ""},
	company: {type: String, default: ""},
	emailEnabled: {type: Boolean, default: false},
	emailVerified: {type: Boolean, default: false},
	created: {type: Date, default: Date.now }
});

userSchema.path('roles').validate(function(value) {
	valid = true;

	if(!value)
		return false;

	value.forEach(function(entry) {
		if(!/normal|staff/i.test(value))
			valid = false;
	});

	return valid;
}, 'Invalid role, must be either normal or staff');

userSchema.path('email').validate(function(value) {
	return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value);
}, 'Invalid email address');

/* We are going to override the _id, so that our ID can be a numeric value is instead of a hash */
userSchema.pre('save', function(next) {
	var user = this;

	if(!this.isNew)
	{
		next();
		return;
	}

	settings.Settings.findByIdAndUpdate( settings.SettingsKey, { $inc: { nextSeqNumber: 1 } }, function(err, settingObj) {
		if(err) next(err);

		user._id = settingObj.nextSeqNumber - 1;
		next();
	});

});

var User = db.model('User', userSchema);

/* Add an exists method to the user model */
User.exists = function(id) {
	
	var deferred = Q.defer();

	User.findById(id, function(err, obj) {
		if(err)
		{
			deferred.reject(err)
			return;
		}

		if(!obj)
		{
			deferred.reject({
				message: "User of id " + id + " does not exist"
			});
		}

		deferred.resolve();
	});

	return deferred.promise;
};

module.exports = User;
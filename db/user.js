var settings = require('../db/settings');
var db = require('../db/db');

var Schema = db.Schema;

var userSchema = new Schema({
	_id: {type: Number},
	firstname: {type: String, required: true},
	lastname: {type: String, required: true},
	email: {type: String, required: true },
	roles: {type: [String], default: ["Normal"] },
	passwordHash: String,
	phone: Number,
	locations: { type: [Schema.Types.ObjectId], default: [], ref: "Location" },
	userNotes: { type: String, default: ""},
	company: {type: String, default: ""},
	emailEnabled: {type: Boolean, default: false},
	emailVerified: {type: Boolean, default: false},
	created: {type: Date, default: Date.now }
});

userSchema.path('roles').validate(function(value) {
	valid = true;

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

	settings.Settings.findByIdAndUpdate( settings.SettingsKey, { $inc: { nextSeqNumber: 1 } }, function(err, settingObj) {
		if(err) next(err);

		user._id = settingObj.nextSeqNumber - 1;
		next();
	});

});

var User = db.model('User', userSchema);

module.exports = User;
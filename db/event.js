var settings = require('../db/settings');
var db = require('../db/db');

var Location = require('../db/location')
var User = require('../db/user')

var Schema = db.Schema;

var treeSchema = new Schema({
	type: String,
	quantity: Number
});

var eventsSchema = new Schema({
	_id: {type: Number},
	owner: {type: Number, required: true, ref: 'User'},
	description: { type: String, default: '' },
	location: { type: Number, ref: 'Location' },
	trees: [treeSchema],
	datetime: { type: Date, required: true },
	endtime: { type: Date, required: true},
	status: { type: String, default: "pending", enum: ['pending', 'rejected', 'approved', 'canceled', 'completed'] },
	attendees: [{ type: Number, ref: 'User' }],
	staffNotes: {type: String, default: ""},
	created: {type: Date, default: Date.now }
});

/* We are going to override the _id, so that our ID can be a numeric value is instead of a hash */
eventsSchema.pre('save', function(next) {
	var event = this;

	if(!this.isNew)
	{
		next();
		return;
	}

	settings.Settings.findByIdAndUpdate( settings.SettingsKey, { $inc: { nextSeqNumber: 1 } }, function(err, settingObj) {
		if(err) next(err);

		event._id = settingObj.nextSeqNumber - 1;
		next();
	});
});

var Event = db.model('Event', eventsSchema);

module.exports = Event;
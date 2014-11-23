
var db = require('../db/db');
var Schema = db.Schema;

var settingsKey = 'oBaq1027l7tPInXgCtjRljjxZ72zHGA6A0bjfgaA9Lb2GoRZE2BNcP6kde8ADt1';

var settingSchema = new Schema({
	_id: String,
	nextSeqNumber: { type: Number, default: 0}
});

var Settings = db.model('Settings', settingSchema);

Settings.update({_id: settingsKey}, {
	_id: settingsKey,
	nextSeqNumber: 0
}, {
	upsert: true
}, function (err){
	if(err) console.log(err)
});

module.exports.SettingsKey = settingsKey;
module.exports.Settings = Settings;
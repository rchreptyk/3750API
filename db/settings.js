
var db = require('../db/db');
var Schema = db.Schema;

var settingsKey = 'oBaq1027l7tPInXgCtjRljjxZ72zHGA6A0bjfgaA9Lb2GoRZE2BNcP6kde8ADt1';

var settingSchema = new Schema({
	_id: { type: String,  default: settingsKey},
	nextSeqNumber: { type: Number, default: 0}
});

var Settings = db.model('Settings', settingSchema);

Settings.findById(settingsKey, function(err, settings) {
	if(err)
	{
		console.log(err);
		return;
	}

	if(!settings)
	{
		settings = new Settings();
		settings.save(function(err) {
			console.log(err);
			return;
		});
	}
});

module.exports.SettingsKey = settingsKey;
module.exports.Settings = Settings;
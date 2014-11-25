var _ = require('underscore');

function getErrorObj(err) {
	return {
		message: err.message,
		errors: _.pluck(err.errors, 'message')
	}
}

module.exports.getErrorObj = getErrorObj;
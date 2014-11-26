/* Methods for returning error messages */

var _ = require('underscore');

/* Return a human error message from a mongoose error */ 
function getErrorObj(err) {
	return {
		message: err.message,
		errors: _.pluck(err.errors, 'message')
	}
}

module.exports.getErrorObj = getErrorObj;
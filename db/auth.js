/**

Define the module for authentication in the API

*/


var settings = require('../db/settings');
var db = require('../db/db');

var whitelist = require('../db/auth_whitelist');

var Q = require('q');

var Schema = db.Schema;

var tokenSchema = new Schema({
	token: {type: String, index: { unique: true }},
	user: {type: Number, ref: 'User'},
	created: {type: Date, expires: 60*60*24}
});

var Token = db.model('Token', tokenSchema);

/* Get a new random token */
function getToken() {
	return Q.Promise(function(resolve) {
		require('crypto').randomBytes(48, function(ex, buf) {
		  resolve(buf.toString('hex'));
		});
	})
}

/* Generate a new token for a user */
function generateToken(user) {
	return getToken().then(function (token) {
		return Q.Promise(function (resolve, reject) {

			var tokenEntry = new Token();
			tokenEntry.token = token;
			console.log("HERE");
			tokenEntry.user = user._id;

			tokenEntry.save(function(err) {
				if(err)
					reject(err);
				else
					resolve(token);
			})
		})
	});
};

module.exports.generateToken = generateToken;

/* Delete a users auth token */
function deauthenticate(req) {
	var token = getTokenFromHeader(req);
	return Q.Promise(function (resolve, reject) {
		Token.findOneAndRemove({token: token}).exec(function(err) {
			if(err)
				reject(err);
			else
				resolve();
		});
	});
}

module.exports.deauthenticate = deauthenticate;

/* Get the user associated with a token */
function getUser(token) {
	return Q.Promise(function (resolve, reject) {
		Token.findOne({token: token}).populate('user').exec(function(err, tk) {
			if(err || !tk)
				reject(err);
			else
				resolve(tk.user);
		});
	});
}

/* Is the req a whitelisted with no auth required */
function isWhiteListed(req) {

	for(var i = 0; i < whitelist.length; i++) {
		var item = whitelist[i];

		if(item.path.test(req.path) && item.method == req.method)
			return true;

	}

	return false;
}

/* Get the token from the request */
function getTokenFromHeader(req) {
	var header = req.headers['authorization'];
	return header.split(/\s+/).pop().split('=').pop();
}

/* Authentication middleware to ensure authentication */
module.exports.authenticator = function(req, res, next) {
	if(isWhiteListed(req))
	{
		next();
		return;
	}

	if(!req.headers['authorization'])
	{
		res.status(401).send({
			message: "Access Denied. Authentication required"
		});
		return;
	}

	var token = getTokenFromHeader(req);

	getUser(token).then(function(user) {
		req.user = user;
		next();
	}).fail(function(err){
		if(err)
			res.status(500).send(err)
		else
			res.status(401).send({
				message: "Authorization failed. Invalid or expired token"
			})
	})
}
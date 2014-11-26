
/* Define a list of requests that are allowed to be made with being authenticated */

module.exports = [
	{ method: 'POST', path: /^\/users\/?$/ },
	{ method: 'POST', path: /^\/users\/authenticate$/ }
];
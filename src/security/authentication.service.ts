
'use strict';

/**
 * Authenticator.
 */

var request = require('request');
var createError = require('http-errors');

var Q = require('q');
var _ = require('lodash');
import l from '../logger';


/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 401
 */
export function ensureIsAuthenticated(req, res, next) {
	authenticate(req, res)
		.then(function() {
			next();
		})
		.catch(function(err) {
			next(createError(401, err))
		})
		.done();
};

export function authenticate(req, res) {
	return queryMe(req)
		.then(function(user) {
			req.user = user;
			return user;
		})
}

function queryMe(req) {
	return Q.nfcall(request.get,  {
			url: process.env.AUTHENTICATOR_URI + "/api/users/me",
			headers: { authorization: req.headers.authorization },
			json: true,
		})
		.then(function(data) {
			var response = data[0];
			var body = data[1];
			if (response.statusCode >= 300)
				throw 'Can not authenticate user. Auth server response: ' + JSON.stringify(body);
			return body;
		})
}

/**
 * #####  UTILS  #####
 */

/**
 * Checks if request is authenticated
 */
export function isAuthenticated(req) {
	return !_.isNil(req.user);
}


/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function getUserInfomations(email) {
	// TODO: Need to auth server-server

	return Q.nfcall(request.get, {
			url: process.env.AUTHENTICATOR_URI + "/email/" + email,
			// headers: { authorization: req.headers.authorization },
			json: true,
		})
		.then(function(data) {
			var response = data[0];
			var body = data[1];
			if (response.statusCode >= 300)
				throw 'Can not get user infos from authenticator server. Reason: ' + JSON.stringify(body);
			return body;
		})
		.then(function(user) {
			return user;
		})
		.catch(function(err) {
			l.error("Can not get user infos from authenticator server. Reason: " + err);
		});
}


// check configuration
(function () {
	if(process.env.AUTHENTICATOR_URI)
		l.debug('using ' + process.env.AUTHENTICATOR_URI + ' to authentication');
	else
		l.error('no AUTH_URI setted in the environment');
})();

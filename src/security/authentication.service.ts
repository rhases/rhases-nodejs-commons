
'use strict';

/**
 * Authenticator.
 */
import l from '../logger';

var request = require('request');
var createError = require('http-errors');

var Q = require('q');
var _ = require('lodash');


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
	const uri = process.env.AUTHENTICATOR_URI ||
		req.protocol + '://' + req.get('host'); //same server
	const url =  uri + '/api/users/me';
	return Q.nfcall(request.get,  {
			url,
			headers: { authorization: req.headers.authorization },
			json: true,
		})
		.then(function(data) {
			var response = data[0];
			var body = data[1];
			if (response.statusCode >= 300){
				l.warn(`[access denied] Auth server url: ${url}`);
				l.warn(`[access denied] Auth server response: \n ${JSON.stringify(body)}`);
				throw `Can not authenticate user.Check server for log.`; 
			}
				
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
			url: process.env.AUTHENTICATOR_URI + "/api/users/email/" + email,
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
		l.error('no AUTHENTICATOR_URI setted in the environment');
})();


'use strict';

/**
 * Authenticator.
 */
import Q from 'q';
import _ from 'lodash';
import { authenticate } from './authentication.service'

//import config from '../../config/environment';

import l from '../logger';
/**
 * #####  INTERNALS METHODS  #####
 */

// To compatibility
function getRoles(user) {
	var roles = [];
	if (user) {
		if (user.role)
			roles.push(user.role);

		if (user.roles) {
			for(var i = 0; i < user.roles.length; i++)
				roles.push(user.roles[i]);
		}
	}

	return roles;
}

/**
 * #####  UTILS  #####
 */

/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function hasRole(user, roleRequired) {
	return getRoles(user).indexOf(roleRequired) >= 0;
}


/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function hasAnyRole(user, anyRolesRequired) {
	var roles = getRoles(user);
	for(var i = 0; i < anyRolesRequired.length; i++) {
		if (roles.indexOf(anyRolesRequired[i]) >= 0) {
			return true;
		}
	}
	return false;
}


/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function hasAllRoles(user, allRolesRequired) {
	var roles = getRoles(user);
	for(var i = 0; i < allRolesRequired.length; i++) {
		if (roles.indexOf(allRolesRequired[i]) >= 0) {
			return false;
		}
	}
	return true;
}

/**
 * #####  INTERCEPTORS  #####
 */


/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function ensureHasRole(roleRequired) {
    if (!roleRequired) {
        throw new Error('Required role needs to be set');
    }

    return function(req, res, next) {
			authenticate(req, res)
			.then(function() {
				if (!req.user)
					return;

				if (hasRole(req.user, roleRequired)) {
	                next();
				} else {
					l.error("Can not authenticate this request against authenticator server. Reason: This user '" + req.user.name + "/" +req.user.email+"' dont have the role '" + roleRequired + "'.");
					res.status(403).send('Forbidden');
				}
			})
			.catch(function(err) {
				l.error("Unexpected error. Reason: " + err);
				res.status(500).send(err);
			})
			.done();
        };

}


/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function ensureHasAnyRole(anyRolesRequired) {
    if (!anyRolesRequired) {
        throw new Error('Required role needs to be set');
    }

    return function(req, res, next) {
			authenticate(req, res)
			.then(function() {
				if (!req.user)
					return;

				if (hasAnyRole(req.user, anyRolesRequired)) {
					next();
				} else {
					l.error("Can not authenticate this request against authenticator server. Reason: This user '" + req.user.name + "/" +req.user.email+"' dont have the role '" + anyRolesRequired + "'.");
					res.status(403).send('Forbidden');
				}
			})
			.catch(function(err) {
				l.error("Unexpected error. Reason: " + err);
				res.status(500).send(err);
			})
			.done();
        };

}


/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function ensureHasAllRoles(allRolesRequired) {
    if (!allRolesRequired) {
        throw new Error('Required role needs to be set');
    }

    return function(req, res, next) {
			authenticate(req, res)
			.then(function() {
				if (!req.user)
					return;

				if (hasAllRoles(req.user, allRolesRequired)) {
					next();
				} else {
					l.error("Can not authenticate this request against authenticator server. Reason: This user '" + req.user.name + "/" +req.user.email+"' dont have the role '" + allRolesRequired + "'.");
					res.status(403).send('Forbidden');
				}
			})
			.catch(function(err) {
				l.error("Unexpected error. Reason: " + err);
				res.status(500).send(err);
			})
			.done();
        };

}

'use strict'

import { isAuthenticated } from '../security/authentication.service';
import { hasRole } from '../security/authorization.utils';
import l from '../logger';
var createError = require('http-errors');


export function checkAuthorization(op, req){
  return function(entity){
    l.debug(entity);
    l.debug('verifying authorization of "' + op + '" for user ' + (req.user ? req.user.name : 'unauthenticated'));

    if(entity.userId && (!isAuthenticated(req) || entity.userId !== req.user._id)){
      throw createError(403, 'userId of loggedin user different from entity owner');
    }
    return entity; //ok
  }
}


export function restrictByUser(req){
  return function(query){
    if(hasRole(req.user, 'admin')){
      return query
    }
    query.where("userId").eq(req.user._id);
  }
}

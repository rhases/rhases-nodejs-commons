'use strict'

import { hasRole } from './authorization.utils';

export function checkAuthorization(op, req){
  return function(entity){
    //if not auth throws error

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

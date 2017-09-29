'use strict';

var Q = require('q');
var createError = require('http-errors');
import l from '../logger';

export function assertGranted(permission:any){
  var defer = Q.defer();
  if(!permission.granted){
    defer.reject(createError(403, `not authorized for user with roles ${permission.allRoles}`));
  }else{
    l.trace(permission);
    defer.resolve(permission)
  }
  return defer.promise;
}

export function ifGranted(type:string, _for:string, permission:any, op:(any)=>any ){
  if(permission.type && type === permission.type
    && permission.for && _for === permission.for ){
    return op;
  }else{
    l.trace(`not match for ${type} and ${_for} in this permission. Returning identity fnc`)
    return (value)=>value; //return nop
  }
}
export function ifGrantedForUser(permission:any, op:(any)=>any ){
  return ifGranted('own', 'user', permission, op)
}
export function ifGrantedForOrganization(permission:any, op:(any)=>any ){
  return ifGranted('own', 'organization', permission, op)
}
export function ifDefined(func){
  if(func){
    return func;
  }else{
    return (value)=>value; //return nop
  }
}

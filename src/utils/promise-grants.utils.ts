'use strict';

var Q = require('q');
var _ = require('lodash');

var createError = require('http-errors');
import l from '../logger';
import { Grant } from '../crud/access-control.authorization';

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

export function ifGranted(type:string, ownerType:string, grant:Grant, op:(any)=>any ){
  if(grant.type && type === grant.type
    && (!ownerType ||  grant.ownerTypes.indexOf(ownerType) >=0 )){
    return op;
  }else{
    l.trace(`not match for ${ownerType}:${type} in this permission. Returning identity fnc`)
    return (value)=>value; //return nop
  }
}
export function ifGrantedForOwn(grant:Grant, op:(any)=>any ){
  return ifGranted('own', undefined, grant, op)
}
export function ifGrantedForUser(grant:Grant, op:(any)=>any ){
  return ifGranted('own', 'user', grant, op)
}
export function ifGrantedForOrganization(grant:Grant, op:(any)=>any ){
  return ifGranted('own', 'organization', grant, op)
}
export function ifGrantedAny(grant:Grant, op:(any)=>any ){
  return ifGranted('any', undefined, grant, op)
}

export function ifDefined(func){
  if(func){
    return func;
  }else{
    return (value)=>value; //return nop
  }
}

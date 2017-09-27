'use strict';

var Q = require('q');
var createError = require('http-errors');

export function assertGranted(permission:any){
  var defer = Q.defer();
  if(!permission.granted){
    defer.reject(createError(403, `not authorized for user with roles ${permission.allRoles}`));
  }else{
    defer.resolve(permission)
  }
  return defer.promise;
}

export function ifGranted(type:string, _for:string, permission:any, op:(any)=>any ){
  if(permission.type && type === permission.type
    && permission.for && _for === permission.for ){
    return op;
  }else{
    return (value)=>value; //return nop
  }
}

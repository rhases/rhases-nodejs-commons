//import l from '../logger';
import { Request, Response } from 'express';
import l from '../logger';
var createError = require('http-errors');
import { assertGranted } from  '../utils/promise-grants.utils';

export function respondWithResult(res: Response, statusCode?:number) {
  statusCode = statusCode || 200;
  return function(entity: any) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}


export function handleEntityNotFound(res: Response) {
  return function(entity: any) {
    if (!entity) {
      throw createError(404)
    }
    return entity;
  };
}

export function handleError(res:any, statusCode?:number) {
  statusCode = statusCode || 500;
  return function(err: any) {
    l.debug('responding with http error');
    l.debug(err);
    if(err.statusCode){
      res.status(err.statusCode).send(err.message)
      return
    }
    if(err.name === 'ValidationError')
      statusCode = 400;
    res.status(statusCode).send(err);
  };
}

export function successMessageResult(){
  return function() {
    return 'Success';
  }
}

export function baseHandle(req: any, res:Response, promisedAc, op:string, handleFnc){
  var self = this;
  promisedAc
  .then(function(accessControl){
    var permission = accessControl.check(req.user, op);
    return assertGranted(permission)
  })
  .then(function(permission){
    return handleFnc(permission, req.user);
  })
  .then(self.respondWithResult(res))
  .catch(self.handleError(res))
}

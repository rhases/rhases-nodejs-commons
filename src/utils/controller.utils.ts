//import l from '../logger';
import { Request, Response } from 'express';
import l from '../logger';
var createError = require('http-errors');
import { assertGranted } from  '../utils/promise-grants.utils';
import { CallOptions } from './options';
var _ = require('lodash');

export function respondWithResult(res: Response, operation?: string) {
  const statusCode = (operation == 'create') ? 201 : 200;
  return (entity: any) => {
    if (entity) {
      res.status(statusCode).json(entity);
    }
    return entity;
  };
}

export function handleEntityNotFound(res: Response) {
  return function(entity: any) {
    if (!entity) {
      throw createError(404);
    }
    return entity;
  };
}

export function handleEntityNotFoundEmpyList(res) {
  return function (result) {
    if (!result[0]) {
      throw createError(404);
    }
    return result[0];
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
    throw err;
  };
}

export function successMessageResult(){
  return function() {
    return 'Success';
  }
}

export function baseHandle(req: any, res: Response, promisedAc, op: string, handleFnc, options?: CallOptions) {
  var self = this;
  return promisedAc
    .then(function(accessControl){
      var permission = accessControl.check(req.user, op);
      return assertGranted(permission)
    })
    .then(function(permission){
      return handleFnc(permission, req.user);
    })
    .then(content => (options && options.transformOut) ? options.transformOut(content) : content)
    .then(self.respondWithResult(res, op))
    .catch(self.handleError(res))
}

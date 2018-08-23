import l from '../logger';

var Q = require('q');

import { checkAuthorization } from './base.authorization';
import { handleEntityNotFound, respondWithResult, handleError } from '../utils/controller.utils';

import { createEntity, findEntityById, applyUpdate, applyPatch, removeEntity}  from '../utils/entity.utils';
import  { createQueryExecutor, execFindAndCount } from '../utils/base.query-builder';

import { Request, Response } from 'express';
import { Model, Document, DocumentQuery } from 'mongoose';


export function baseCtrlCreate(req: Request, res: Response, model: Model<Document>, options?:any) {
  entityFromBody(req, options && options.setUser)
  .then(checkAuthorization('create', req))
  .then(createEntity(model))
  .then(respondWithResult(res, 'create'))
  .catch(handleError(res))
}

export function baseCtrlFind(req: any, res: Response, model: Model<Document>) {
  baseCtrlFindWithQueryBuilder(req, res, model, function(query){
    query.byUser(req.user)
    return query;
  })
}

export function baseCtrlFindWithQueryBuilder(req: Request, res: Response, model: Model<Document>, queryBuilder: (query: any) => DocumentQuery<any, any>) {
  Q.when()
  .then(createQueryExecutor(model, queryBuilder))
  .then(execFindAndCount(req.query, res))
  .then(respondWithResult(res))
  .catch(handleError(res))
}

export function baseCtrlFindById(req: Request, res: Response, model: Model<Document>){
  findEntityById(model, req.params.id)
  .then(handleEntityNotFound(res))
  .then(checkAuthorization('read', req))
  .then(respondWithResult(res))
  .catch(handleError(res))
}

export function baseCtrlUpdate(req: Request, res: Response, model: Model<Document>) {
  //contruct query
  findEntityById(model, req.params.id)
  .then(handleEntityNotFound(res))
  .then(checkAuthorization('update', req))
  .then(applyUpdate(req.body))
  .then(respondWithResult(res))
  .catch(handleError(res))
}

export function baseCtrlPatch(req: Request, res: Response, model: Model<Document>) {
  //contruct query
  findEntityById(model, req.params.id)
  .then(handleEntityNotFound(res))
  .then(checkAuthorization('update', req))
  .then(applyPatch(req.body))
  .then(respondWithResult(res))
  .catch(handleError(res))
}

export function baseCtrlRemove(req: Request, res: Response, model: Model<Document>) {
  //contruct query
  findEntityById(model, req.params.id)
  .then(checkAuthorization('delete', req))
  .then(removeEntity())
  .then(respondWithResult(res))
  .catch(handleError(res))
}

function entityFromBody(req, setUser){
  let entity = req.body;
  if(req.user && setUser)
    entity.userId = req.user._id;

  return Q.when(entity);
}

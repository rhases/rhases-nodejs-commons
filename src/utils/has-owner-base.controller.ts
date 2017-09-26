import l from '../logger';

var Q = require('q');

import  { HasOwnerAccessControl } from './access-control.authorization';
import { handleEntityNotFound, respondWithResult, handleError } from './controller.utils';

import { createEntity, findEntityById, applyUpdate, applyPatch, removeEntity}  from './entity.utils';
import  { createQueryExecutor, execFindAndCound } from './base.query-builder';

import { Request, Response } from 'express';
import { Model, Document, DocumentQuery } from 'mongoose';
import { AccessControl } from 'accesscontrol';

export class HasOnwerBaseController {
  ac:HasOwnerAccessControl;

  constructor(private model: Model<Document>, resource:string, grants:any){
    this.ac = new HasOwnerAccessControl(resource, grants);
  }


  create(req: Request, res: Response, options?:any) {
    var check= this.ac.checkCreate(req)
    .then(function(check){
      this.entityFromBody(req)
      .then(check.setBeforeQuery)
      .then(createEntity(this.model))
      .then(check.filter)
      .then(respondWithResult(res))
      .catch(handleError(res))
    })

  }

  find(req: any, res: Response) {
    var check= this.ac.checkFind(req)
    .then(function(check){
      createQueryExecutor(this.model, check.queryBuilder)
      .then(execFindAndCound(req.query, res))
      .then(respondWithResult(res))
      .then(check.filter)
      .catch(handleError(res))
    })
  }

  findById(req: Request, res: Response){
    findEntityById(this.model, req.params.id)
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res))
  }
  //
  // update(req: Request, res: Response, model: Model<Document>) {
  //   //contruct query
  //   findEntityById(model, req.params.id)
  //   .then(handleEntityNotFound(res))
  //   .then(checkAuthorization('update', req))
  //   .then(applyUpdate(req.body))
  //   .then(respondWithResult(res))
  //   .catch(handleError(res))
  // }
  //
  // patch(req: Request, res: Response, model: Model<Document>) {
  //   //contruct query
  //   findEntityById(model, req.params.id)
  //   .then(handleEntityNotFound(res))
  //   .then(checkAuthorization('update', req))
  //   .then(applyPatch(req.body))
  //   .then(respondWithResult(res))
  //   .catch(handleError(res))
  // }
  //
  // remove(req: Request, res: Response, model: Model<Document>) {
  //   //contruct query
  //   findEntityById(model, req.params.id)
  //   .then(checkAuthorization('delete', req))
  //   .then(removeEntity())
  //   .then(respondWithResult(res))
  //   .catch(handleError(res))
  // }

  private entityFromBody(req, setUser){
    let entity = req.body;
    if(req.user && setUser)
      entity.userId = req.user._id;

    return Q.when(entity);
  }
}

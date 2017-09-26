import l from '../logger';

var Q = require('q');

import  { CrudAccessControl } from './access-control.authorization';
import { handleEntityNotFound, respondWithResult, handleError , successMessageResult} from '../utils/controller.utils';

import { createEntity, findEntityById, applyUpdate, applyPatch, removeEntity}  from '../utils/entity.utils';
import  { createQueryExecutor, execFindAndCound, execFindByIdWithQueryBuilder } from '../utils/base.query-builder';

import { Request, Response } from 'express';
import { Model, Document, DocumentQuery } from 'mongoose';
import { AccessControl } from 'accesscontrol';

export class AccessControlBaseController {
  ac:CrudAccessControl;

  constructor(private model: Model<Document>, grants:any){
    var _resource = model.collection.collectionName;

    grants.forEach(function(grant) { grant.resource = grant.resource|| _resource});
    this.ac = new CrudAccessControl(_resource, grants);
    l.debug(`inited access control for ${_resource}`);
  }

  create(req: Request, res: Response) {
    var self = this;
    self.ac.checkCreate(req)
    .then(function(check){
      return self.entityFromBody(req)
      .then(check.setBeforeUpdate)
      .then(createEntity(self.model))
      .then(check.filterAfterQuery)
    })
    .then(respondWithResult(res))
    .catch(handleError(res))

  }

  find(req: any, res: Response) {
    var self = this;
    self.ac.checkRead(req)
    .then(function(check){
      return createQueryExecutor(self.model, check.applyQueryRestriction)
      .then(execFindAndCound(req.query, res))
      .then(check.filterAfterQuery)
    })
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  findById(req: Request, res: Response){
    var self = this;
    self.ac.checkRead(req)
    .then(function(check){
      return execFindByIdWithQueryBuilder(self.model, req.params.id, check.applyQueryRestriction)
      .then(handleEntityNotFound(res))
      .then(check.filterAfterQuery)
    })
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  update(req: Request, res: Response) {
    var self = this;
    self.ac.checkUpdate(req)
    .then(function(check){
      return execFindByIdWithQueryBuilder(self.model, req.params.id, check.applyQueryRestriction)
      .then(handleEntityNotFound(res))
      .then(applyUpdate(req.body))
      .then(check.filterAfterQuery)
    })
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  patch(req: Request, res: Response) {
    var self = this;
    self.ac.checkUpdate(req)
    .then(function(check){
      return execFindByIdWithQueryBuilder(self.model, req.params.id, check.applyQueryRestriction)
      .then(handleEntityNotFound(res))
      .then(applyPatch(req.body))
      .then(check.filterAfterQuery)
    })
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  remove(req: Request, res: Response, model: Model<Document>) {
    //contruct query
    var self = this;
    self.ac.checkUpdate(req)
    .then(function(check){
      return execFindByIdWithQueryBuilder(self.model, req.params.id, check.applyQueryRestriction)
        .then(handleEntityNotFound(res))
        .then(removeEntity())
        .then(successMessageResult())
    })
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  private entityFromBody(req){
    let entity = req.body;
    return Q.when(entity);
  }
}

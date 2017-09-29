import l from '../logger';

var Q = require('q');
var _ = require('lodash');

import  { CrudAccessControl } from './access-control.authorization';
import { handleEntityNotFound, respondWithResult, handleError , successMessageResult} from '../utils/controller.utils';

import { createEntity, findEntityById, applyUpdate, applyPatch, removeEntity, setUserOwner, setOrganizationOwner, attributesFilter}  from '../utils/entity.utils';
import  { createQueryExecutor, execFindAndCount, execFindByIdWithQueryBuilder, restrictByUserOwner, restrictByOrganizationOwner, createFindByIdQuery, execQuery } from '../utils/base.query-builder';

import { Request, Response } from 'express';
import { Model, Document, DocumentQuery } from 'mongoose';

import { ifGrantedForUser, ifGrantedForOrganization, assertGranted, ifDefined} from '../utils/promise-grants.utils';
import { now } from '../utils/functions.utils';

export class AccessControlBaseController {
  ac:CrudAccessControl;

  constructor(private model: Model<Document>, grants:any){
    var _resource = model.collection.collectionName;

    grants.forEach(function(grant) { grant.resource = grant.resource|| _resource});
    this.ac = new CrudAccessControl(_resource, grants);
    l.debug(`inited access control for ${_resource}`);
  }

  create(req: any, res: Response) {
    var self = this;
    var permission = self.ac.check(req.user, 'create');

    return assertGranted(permission)
    .then(self.entityFromBody(req))
    .then(ifGrantedForUser(permission, setUserOwner(req.user)))
    .then(ifGrantedForOrganization(permission, setOrganizationOwner(req.user)))
    .then(createEntity(self.model))
    //.then(permission.filter)
    .then(respondWithResult(res))
    .catch(handleError(res))

  }

  find(req: any, res: Response, exQueryBuilder?) {
    var self = this;
    var permission = self.ac.check(req.user, 'read');
    var stack =[];

    return assertGranted(permission)
    .then(function(){
      return function(query){
        return now(query)
        .then(ifGrantedForUser(permission, restrictByUserOwner(req.user)))
        .then(ifGrantedForOrganization(permission, restrictByOrganizationOwner(req.user)))
        .then(ifDefined(exQueryBuilder))
        .then(function(param){
           l.trace(`query: ${param}`);
           return param;
        })
        .value();
      }
    })
    .then(createQueryExecutor(self.model))
    .then(execFindAndCount(req.query, res))
    //.then(attributesFilter(permission))
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  findById(req: any, res: Response){
    var self = this;
    var permission = self.ac.check(req.user, 'read');

    return assertGranted(permission)
    .then(self.findBydId(req.params.id, req.user, permission))
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  update(req: any, res: Response) {
    var self = this;
    var permission = self.ac.check(req.user, 'update');

    return assertGranted(permission)
    .then(self.findBydId(req.params.id, req.user, permission))
    .then(handleEntityNotFound(res))
    .then(applyUpdate(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  patch(req: any, res: Response) {
    var self = this;
    var permission = self.ac.check(req.user, 'update');
    l.debug(req.body)

    return assertGranted(permission)
    .then(self.findBydId(req.params.id, req.user, permission))
    .then(handleEntityNotFound(res))
    .then(applyPatch(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res))

  }

  remove(req: any, res: Response) {
    var self = this;
    var permission = self.ac.check(req.user, 'delete');

    return assertGranted(permission)
    .then(self.findBydId(req.params.id, req.user, permission))
    .then(handleEntityNotFound(res))
    .then(removeEntity())
    .then(successMessageResult())
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  private findBydId(id, user, permission){
    var self = this;
    return function(){
      return Q.when(self.model.findById(id))
    }
  }

  private entityFromBody(req){
    return function(){
        let entity = req.body;
        return entity;
    }
  }
}

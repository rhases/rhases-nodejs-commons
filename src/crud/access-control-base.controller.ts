import l from '../logger';

var Q = require('q');
var _ = require('lodash');
import { Promise } from 'q';

import  { CrudAccessControl } from './access-control.authorization';
import  { crudAccessControlWithOrgRolesFactory } from './access-control-with-organizations.authorization';
import { baseHandle,  handleEntityNotFound, respondWithResult, handleError , successMessageResult} from '../utils/controller.utils';

import { createEntity, findEntityById, applyUpdate, applyPatch, removeEntity, setUserOwner, setOrganizationOwner, attributesFilter}  from '../utils/entity.utils';
import  { createQueryExecutor, execFindAndCount, execFindByIdWithQueryBuilder, restrictByOwner, createFindByIdQuery, execQuery } from '../utils/base.query-builder';

import { Request, Response } from 'express';
import { Model, Document, DocumentQuery } from 'mongoose';

import { ifGrantedForOwn, ifGrantedForUser, ifGrantedForOrganization, assertGranted, ifDefined} from '../utils/promise-grants.utils';
import { now } from '../utils/functions.utils';
var createError = require('http-errors');

export class AccessControlBaseController {
  promisedAc:Promise<CrudAccessControl>;

  constructor(private model: Model<Document>, grants:any){
    var _resource = model.collection.collectionName;
    this.promisedAc = crudAccessControlWithOrgRolesFactory(_resource, grants);
    l.debug(`inited access control for ${_resource}`);
  }

  create(req: any, res: Response) {
    var self = this;
    baseHandle(req, res, self.promisedAc, 'create', function(permission, user){
      return Q.when()
      .then(self.entityFromBody(req))
      .then(ifGrantedForUser(permission, setUserOwner(user)))
      .then(ifGrantedForOrganization(permission, setOrganizationOwner(user)))
      .then(createEntity(self.model))
    })
  }


  find(req: any, res: Response, exQueryBuilder?:(DocumentQuery)=>DocumentQuery<any, any>) {
    var self = this;
    baseHandle(req, res, self.promisedAc, 'read', function(grant, user){
      return Q.when()
      .then(function(){
        return function(query){
          return now(query)
          .then(ifGrantedForOwn(grant, restrictByOwner(grant.ownerTypes, user._id, user.organization.ref.code)))
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
    })
  }

  findById(req: any, res: Response){
    var self = this;
    baseHandle(req, res, self.promisedAc, 'read', function(permission, user){
      return Q.when()
      .then(self.findBydId(req.params.id, req.user, permission))
      .then(handleEntityNotFound(res))
    })
  }

  update(req: any, res: Response) {
    var self = this;
    baseHandle(req, res, self.promisedAc, 'update', function(permission, user){
      return Q.when()
      .then(self.findBydId(req.params.id, req.user, permission))
      .then(handleEntityNotFound(res))
      .then(applyUpdate(req.body))
    })
  }

  patch(req: any, res: Response) {
    var self = this;
    baseHandle(req, res, self.promisedAc, 'update', function(permission, user){
      return Q.when()
      .then(self.findBydId(req.params.id, req.user, permission))
      .then(handleEntityNotFound(res))
      .then(applyPatch(req.body))
    })
  }

  remove(req: any, res: Response) {
    var self = this;
    baseHandle(req, res, self.promisedAc, 'delete', function(permission, user){
      return Q.when()
      .then(self.findBydId(req.params.id, user, permission))
      .then(handleEntityNotFound(res))
      .then(removeEntity())
      .then(successMessageResult())
    })
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

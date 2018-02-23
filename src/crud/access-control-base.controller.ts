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
    return baseHandle(req, res, self.promisedAc, 'create', function(grant, user){
      return Q.when()
      .then(self.entityFromBody(req))
      .then(self.setOwner(grant, user))
      .then(createEntity(self.model))
    })
  }


  find(req: any, res: Response, exQueryBuilder?:(DocumentQuery)=>DocumentQuery<any, any>) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'read', function(grant, user){
      return Q.when()
      .then(self.restrictedQueryBuilderFactory(grant, user, exQueryBuilder))
      .then(createQueryExecutor(self.model))
      .then(execFindAndCount(req.query, res))
    })
  }


  findById(req: any, res: Response, exQueryBuilder?:(DocumentQuery)=>DocumentQuery<any, any>){
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'read', function(grant, user){
      return Q.when()
      .then(self.restrictedQueryBuilderFactory(grant, user, exQueryBuilder))
      .then(execFindByIdWithQueryBuilder(self.model, req.params.id))
      .then(handleEntityNotFound(res))
    })
  }

  restrictedQueryBuilderFactory(grant, user, exQueryBuilder?) {
    return function() {
      var restrictedQueryBuilder = function(query) {
        var organizationCodes = user.roles
          .filter(function(role) { return role.indexOf('$organization') == 0; })
          .map(function (role) { return role.replace('$organization:', '').replace(':.*$', ''); });

        return now(query)
        .then(ifGrantedForOwn(grant, restrictByOwner(grant.ownerTypes, user._id, organizationCodes)))
        .then(ifDefined(exQueryBuilder))
        .value();
      };
      return restrictedQueryBuilder;
    }
  }

  update(req: any, res: Response) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'update', function(grant, user){
      return Q.when()
      .then(self.restrictedQueryBuilderFactory(grant, user))
      .then(execFindByIdWithQueryBuilder(self.model, req.params.id))
      .then(handleEntityNotFound(res))
      .then(applyUpdate(req.body))
    })
  }

  patch(req: any, res: Response) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'update', function(grant, user){
      return Q.when()
      .then(self.restrictedQueryBuilderFactory(grant, user))
      .then(execFindByIdWithQueryBuilder(self.model, req.params.id))
      .then(handleEntityNotFound(res))
      .then(applyPatch(req.body))
    })
  }

  remove(req: any, res: Response) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'delete', function(grant, user){
      return Q.when()
      .then(self.restrictedQueryBuilderFactory(grant, user))
      .then(execFindByIdWithQueryBuilder(self.model, req.params.id))
      .then(handleEntityNotFound(res))
      .then(removeEntity())
      .then(successMessageResult())
    })
  }

  private setOwner(grant, user){
    return (entity) => {
      l.trace('will set owner')
      l.trace(grant);
      return now(entity)
      .then(ifGrantedForUser(grant, setUserOwner(user)))
      // .then(ifGrantedForOrganization(grant, setOrganizationOwner(user))) // TODO: will not work anymore. need to be revised!!!
      .value()
    }
  }

  private findBydId(id, user, grant){
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

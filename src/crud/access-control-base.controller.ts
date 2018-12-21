import l from '../logger';

var Q = require('q');
var _ = require('lodash');

import { CallOptions } from '../utils/options';
import { Promise } from 'q';

import { CrudAccessControl } from './access-control.authorization';
import { crudAccessControlWithOrgRolesFactory } from './access-control-with-organizations.authorization';
import { baseHandle,  handleEntityNotFound, respondWithResult, handleError , successMessageResult} from '../utils/controller.utils';

import { createEntity, applyUpdate, applyPatch, removeEntity, setUserOwner}  from '../utils/entity.utils';
import { createQueryExecutor, execFindAndCount, execFindByIdWithQueryBuilder, execfindOneAndUpdateWithQueryBuilder, restrictByOwner} from '../utils/base.query-builder';

import { Response } from 'express';
import { Model, Document, DocumentQuery } from 'mongoose';

import { ifGrantedForOwn, ifGrantedForUser, ifGrantedForOrganization, assertGranted, ifDefined} from '../utils/promise-grants.utils';
import { now } from '../utils/functions.utils';


export class AccessControlBaseController {
  promisedAc:Promise<CrudAccessControl>;

  constructor(private model: Model<Document>, grants:any){
    var _resource = model.collection.collectionName;
    this.promisedAc = crudAccessControlWithOrgRolesFactory(_resource, grants);
    l.debug(`inited access control for ${_resource}`);
  }

  create(req: any, res: Response, options: CallOptions) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'create', function(grant, user){
      return Q.when()
      .then(self.entityFromBody(req))
      .then(self.setOwner(grant, user))
      .then(self.applyBeforeUpdateIfDefined(options))
      .then(createEntity(self.model))
    }, options);
  }


  find(req: any, res: Response, exQueryBuilder?: (DocumentQuery) => DocumentQuery<any, any>, 
  options?: CallOptions) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'read', function(grant, user){
      return Q.when()
      .then(self.restrictedQueryBuilderFactory(grant, user, exQueryBuilder))
      .then(createQueryExecutor(self.model))
      .then(execFindAndCount(req.query, res, self.isLean(options)))
    }, options)
  }


  findById(req: any, res: Response, exQueryBuilder?:(DocumentQuery)=>DocumentQuery<any, any>,
    options?: CallOptions) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'read', function(grant, user){
      return Q.when()
      .then(self.restrictedQueryBuilderFactory(grant, user, exQueryBuilder))
      .then(execFindByIdWithQueryBuilder(self.model, req.params.id, options && !!options.transformOut))
      .then(handleEntityNotFound(res))
    }, options)
  }

  restrictedQueryBuilderFactory(grant, user, exQueryBuilder?) {
    return function() {
      var restrictedQueryBuilder = function(query) {
        var organizationCodes = user.roles
          .filter(function(role) { return role.indexOf('$organization') == 0; })
          .map(function (role) { return role.replace('$organization:', '').replace(/:.*$/, ''); });

        return now(query)
        .then(ifGrantedForOwn(grant, restrictByOwner(grant.ownerTypes, user._id, organizationCodes)))
        .then(ifDefined(exQueryBuilder))
        .value();
      };
      return restrictedQueryBuilder;
    }
  }

  update(req: any, res: Response,
    options?: CallOptions) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'update', function(grant, user){
      return Q.when()
      .then(self.restrictedQueryBuilderFactory(grant, user))
      .then(execFindByIdWithQueryBuilder(self.model, req.params.id))
      .then(handleEntityNotFound(res))
      .then(self.applyBeforeUpdateIfDefined(options))
      .then(applyUpdate(req.body))
      .then(self.applyAfterUpdateIfDefined(options))
    }, options)
  }

  updateOp(req: any, res: Response, update: any, options?: CallOptions) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'update', function (grant, user) {
      return Q.when()
        .then(self.restrictedQueryBuilderFactory(grant, user))
        .then(execfindOneAndUpdateWithQueryBuilder(self.model, req.params.id, update))
        .then(handleEntityNotFound(res))
    }, options)
  }

  patch(req: any, res: Response, options?: CallOptions) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'update', function(grant, user){
      return Q.when()
      .then(self.restrictedQueryBuilderFactory(grant, user))
      .then(execFindByIdWithQueryBuilder(self.model, req.params.id))
      .then(handleEntityNotFound(res))
      .then(self.applyBeforeUpdateIfDefined(options))
      .then(applyPatch(req.body))
      .then(self.applyAfterUpdateIfDefined(options))
    }, options)
  }

  remove(req: any, res: Response, options?: CallOptions) {
    var self = this;
    return baseHandle(req, res, self.promisedAc, 'delete', function(grant, user){
      return Q.when()
      .then(self.restrictedQueryBuilderFactory(grant, user))
      .then(execFindByIdWithQueryBuilder(self.model, req.params.id))
      .then(handleEntityNotFound(res))
      .then(removeEntity())
      .then(successMessageResult())
    }, options)
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

  private isLean(options: CallOptions):boolean {
    return options && !!options.transformOut
  }

  private applyBeforeUpdateIfDefined(options?: CallOptions){
    if (options && !!options.beforeSave) {
      return (value) => options.beforeSave(value);
    } else {
      return (value) => (value);
    }
  }

  private applyAfterUpdateIfDefined(options?: CallOptions) {
    if (options && !!options.afterSave) {
      return (value) => options.afterSave(value);
    } else {
      return (value) => (value);
    }
  }

  private entityFromBody(req){
    return function(){
        let entity = req.body;
        return entity;
    }
  }
}

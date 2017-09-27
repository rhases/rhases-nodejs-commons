import l from '../logger';

var Q = require('q');

import  { CrudAccessControl } from './access-control.authorization';
import { handleEntityNotFound, respondWithResult, handleError , successMessageResult} from '../utils/controller.utils';

import { createEntity, findEntityById, applyUpdate, applyPatch, removeEntity, setUserOwner, setOrganizationOwner}  from '../utils/entity.utils';
import  { createQueryExecutor, execFindAndCound, execFindByIdWithQueryBuilder, restrictByUserOrOrganizationOwner } from '../utils/base.query-builder';

import { Request, Response } from 'express';
import { Model, Document, DocumentQuery } from 'mongoose';

import { ifGranted, assertGranted} from '../utils/promise-grants.utils';


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
    .then(ifGranted('own', 'user', permission, setUserOwner))
    .then(ifGranted('own', 'organization', permission, setOrganizationOwner))
    .then(createEntity(self.model))
    .then(permission.filter)
    .then(respondWithResult(res))
    .catch(handleError(res))

  }

  find(req: any, res: Response) {
    var self = this;
    var permission = self.ac.check(req.user, 'read');

    return assertGranted(permission)
    .then(createQueryExecutor(self.model, restrictByUserOrOrganizationOwner(req.user)))
    .then(execFindAndCound(req.query, res))
    .then(permission.filter)
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  findById(req: any, res: Response){
    var self = this;
    var permission = self.ac.check(req.user, 'read');

    return assertGranted(permission)
    .then(execFindByIdWithQueryBuilder(self.model, req.params.id, restrictByUserOrOrganizationOwner(req.user)))
    .then(handleEntityNotFound(res))
    .then(permission.filter)
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  update(req: any, res: Response) {
    var self = this;
    var permission = self.ac.check(req.user, 'update');

    return assertGranted(permission)
    .then(execFindByIdWithQueryBuilder(self.model, req.params.id, restrictByUserOrOrganizationOwner(req.user)))
    .then(handleEntityNotFound(res))
    .then(permission.filter)
    .then(applyUpdate(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  patch(req: any, res: Response) {
    var self = this;
    var permission = self.ac.check(req.user, 'update');

    return assertGranted(permission)
    .then(execFindByIdWithQueryBuilder(self.model, req.params.id, restrictByUserOrOrganizationOwner(req.user)))
    .then(handleEntityNotFound(res))
    .then(applyPatch(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res))

  }

  remove(req: any, res: Response) {
    var self = this;
    var permission = self.ac.check(req.user, 'update');

    return assertGranted(permission)
    .then(execFindByIdWithQueryBuilder(self.model, req.params.id, restrictByUserOrOrganizationOwner(req.user)))
    .then(handleEntityNotFound(res))
    .then(removeEntity())
    .then(successMessageResult())
    .then(respondWithResult(res))
    .catch(handleError(res))
  }

  private entityFromBody(req){
    let entity = req.body;
    return Q.when(entity);
  }
}

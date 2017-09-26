'use strict'

import { isAuthenticated } from '../security/authentication.service';
import { hasRole } from '../security/authorization.utils';
import l from '../logger';
import { AccessControl, Query, Permission } from 'accesscontrol';
import { Model, Document, DocumentQuery } from 'mongoose';
var createError = require('http-errors');
var Q = require('q');

export class CrudAccessControl {

  ac:AccessControl;

  constructor(private resource:string,  private grants:any){
    this.ac = new AccessControl(grants);
  }

  checkCreate(req):Promise<Check>{
    var self = this;
    return this.baseCheck(req, 'create',
      function(check, access){
        return check;
      },
      function(check, access){
        l.debug(req);
        check.setBeforeUpdate = self.setOwner(req);
        return check;
      },
   )
  }

  checkRead(req):Promise<Check>{
    var self = this;
    return this.baseCheck(req, 'read',
      function(check, access){
        return check;
      },
      function(check, access){
        check.applyQueryRestriction = self.restrictByUserOrOrganizationOwner(req)
        return check;
      }
   )
  }

  checkUpdate(req):Promise<Check>{
    var self = this;
    return this.baseCheck(req, 'update',
      function(check, access){
        return check;
      },
      function(check, access){
        check.applyQueryRestriction = self.restrictByUserOrOrganizationOwner(req)
        return check;
      },
   )
  }


  checkDelete(req):Promise<Check>{
    return this.baseCheck(req, 'delete',
      function(check, access){
        return check;
      },
      function(check, access){
        check.applyQueryRestriction = this.restrictByUserOrOrganizationOwner(req)
        return check;
      },
   )
  }

  baseCheck(req, op,
    accessAnyCallback:(check:Check, access:any) => Check,
    accessOwnCallback:(check:Check, access:any) => Check):Promise<Check>{

    l.debug(`${op}:${this.resource}`);
    l.debug(req);
    l.debug(req.user);
    l.debug(req.user.roles);

    var defer = Q.defer();
    var query:Query = this.ac.can(req.user.roles);
    var accessAny = query[op+'Any'](this.resource);
    var check = new Check();

    if(accessAny.granted){
      //any permission
      check.isGranted = true;
      check.filterAfterQuery = this.filterAfterQuery(accessAny);
      l.trace('granted access any');
      defer.resolve(accessAnyCallback(check, accessAny));
    }else {
      //own permission
      var accessOwn = query[op+'Own'](this.resource);
      if(accessOwn.granted){
        check.isGranted = true;
        check.filterAfterQuery = this.filterAfterQuery(accessOwn);
        l.trace('granted access own');
        defer.resolve(accessOwnCallback(check, accessOwn));
      }
    }

    if(!check.isGranted){
      l.warn('access denied.');
      //no permission at all
      defer.reject(createError(403, `user has no permission to ${op} ${this.resource}` ));
    }
    return defer.promise;
  }
  setOwner(req): (any) => any {
    return function(entity){
      entity.owner = {userId: req.user._id}
      return entity;
    }
  }

  filterAfterQuery(permission:Permission):(any) => any{
    //return (toFilter) => permission.filter(toFilter);
    return (toFilter) => toFilter;
  }

  restrictByUserOrOrganizationOwner(req){
    return function(query): DocumentQuery<any, any>{
      return query.where("owner.userId").eq(req.user._id);
      // return query.or([
      //   { "owner.userId" : req.user._id},
      //   { "owner.organizationId": req.user.organization_id },
      // ]);
    }
  }

}

export class Check {
  constructor(public isGranted?:boolean,
    public applyQueryRestriction?: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>,
    public setBeforeUpdate?: (any) => any,
    public filterAfterQuery?: (any) => any){
      function nop(param){
        //l.debug(`nop: ${JSON.stringify(param)}`);
        return param;
      }

      this.isGranted = isGranted || false;
      this.applyQueryRestriction = nop;
      this.setBeforeUpdate = nop;
      this.filterAfterQuery = nop;
  }
}

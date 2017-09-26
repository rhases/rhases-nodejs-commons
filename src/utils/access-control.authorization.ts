'use strict'

import { isAuthenticated } from '../security/authentication.service';
import { hasRole } from '../security/authorization.utils';
import l from '../logger';
import { AccessControl, Query } from 'accesscontrol';

var createError = require('http-errors');
var Q = require('q');

export class HasOwnerAccessControl {

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

  checkFind(req):Promise<Check>{
    var self = this;
    return this.baseCheck(req, 'read',
      function(check, access){
        return check;
      },
      function(check, access){
        check.queryBuilder = self.restrictByUserOrOrganizationOwner
        return check;
      }
   )
  }

  checkFindById(req):Promise<Check>{
    return this.baseCheck(req, 'read',
      function(check, access){
        return check;
      },
      function(check, access){
        check.queryBuilder = this.restrictByUserOrOrganizationOwner
        return check;
      },
   )
  }

  checkUpdate(req):Promise<Check>{
    var self = this;
    return this.baseCheck(req, 'update',
      function(check, access){
        return check;
      },
      function(check, access){
        check.queryBuilder = self.restrictByUserOrOrganizationOwner(req)
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
        check.queryBuilder = this.restrictByUserOrOrganizationOwner(req)
        return check;
      },
   )
  }

  baseCheck(req, op,
    accessAnyCallback:(check:Check, access:any) => Check,
    accessOwnCallback:(check:Check, access:any) => Check):Promise<Check>{

    l.trace(req);

    var defer = Q.defer();
    var query:Query = this.ac.can(req.user.roles);
    var accessAny = query[op+'Any'](this.resource);
    var check = new Check();

    if(accessAny.granted){
      //any permission
      check.isGranted = true;
      check.filterAfterQuery = accessAny.filter;
      l.trace('granted access any');
      defer.resolve(accessAnyCallback(check, accessAny));
    }else {
      //own permission
      var accessOwn = query[op+'Own'](this.resource);
      if(accessOwn.granted){
        check.isGranted = true;
        check.filterAfterQuery = accessOwn.filter;
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
      entity.owner = {userId: req.user.id}
      return entity;
    }
  }

  restrictByUserOrOrganizationOwner(req){
    return function(query){
      query.where.or([
        { "owner.userId" : req.user._id},
        { "owner.organizationId": { in: req.user.organizations || []}},
      ]);
    }
  }

}

export class Check {
  constructor(public isGranted?:boolean,
    public queryBuilder?: (any) => any,
    public setBeforeUpdate?: (any) => any,
    public filterAfterQuery?: (any) => any){
      function nop(param){
        l.debug(`nop: ${JSON.stringify(param)}`);
        return param;
      }

      this.isGranted = isGranted || false;
      this.queryBuilder = nop;
      this.setBeforeUpdate = nop;
      this.filterAfterQuery = nop;
  }
}

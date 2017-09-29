'use strict'

import l from '../logger';
import { AccessControl, Query, Permission } from 'accesscontrol';

export class CrudAccessControl {

  ac:AccessControl;

  constructor(private resource:string,  private grants:any){
    this.ac = new AccessControl(grants);
  }

  check(user:any, op:string):ExPermission{
    var _ac = this.ac;
    //check for user any
    var anyPermission = _ac.can(user.roles)[op+'Any'](this.resource)
    if(anyPermission.granted){
      anyPermission.type = 'any';
      anyPermission.for = 'user';
      return anyPermission;
    }else {
      //check for user own
      var ownPermission = _ac.can(user.roles)[op+'Own'](this.resource);
      if(ownPermission.granted){
        ownPermission.type = 'own';
        ownPermission.for = 'user';
        return ownPermission;
      }else {
        //check for organization own
        var orgRoles = this.getOrgRoles(user);
        var permission = _ac.can(orgRoles)[op+'Own'](this.resource);
        if(permission.granted){
          permission.type = 'own';
          permission.for = 'organization';
        }
        permission.allRoles = [];
        permission.allRoles.push(user.roles);
        permission.allRoles.push(orgRoles);
        return permission;
      }
    }
  }

  getOrgRoles(user){
    var roles = [];
    if(user.organization && user.organization.ref
        && user.organization.ref.code) {
      var org = user.organization;
      roles.push(`${org.ref.code}:${org.role}`);
    }
    return roles;
  }

}

export interface ExPermission extends Permission {
  type:string;
  for:string;
  allRoles:Array<string>;
}

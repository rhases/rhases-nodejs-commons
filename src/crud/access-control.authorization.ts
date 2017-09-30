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
    var permission:ExPermission;
    l.trace(`check can ${user.roles} ${op}Any for ${this.resource}`)
    var anyPermission = this.doCheck(_ac, user.roles, op, 'Any', this.resource);
    if(anyPermission.granted){
      anyPermission.type = 'any';
      anyPermission.for = 'user';
      permission = anyPermission;
    }else {
      //check for user own
      l.trace(`check can ${user.roles} ${op}Own for ${this.resource}`)
      var ownPermission = this.doCheck(_ac, user.roles, op, 'Own', this.resource);
      if(ownPermission.granted){
        ownPermission.type = 'own';
        ownPermission.for = 'user';
        permission = ownPermission;
      }else {
        //check for organization own
        var orgRoles = this.getOrgRoles(user);
        l.trace(`check can ${orgRoles} ${op}Own for ${this.resource}`)

        var permission = this.doCheck(_ac, orgRoles, op, 'Own', this.resource);
        if(permission.granted){
          permission.type = 'own';
          permission.for = 'organization';
        }
        permission.allRoles = orgRoles;
        permission.allRoles.push(user.roles);
        permission = permission;
      }
    }
    l.trace(JSON.stringify(permission), permission);
    if(!permission.granted){ l.trace(_ac.getGrants())  };

    return permission;
  }

  private doCheck(_ac, roles, op, type, resource):ExPermission{
    var permission;
    try {
      permission = _ac.can(roles)[op+type](resource)
    }catch(err){
      l.warn(err.message);
      permission = {granted:false};
    }
    return permission;
  };

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

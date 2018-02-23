'use strict'

import l from '../logger';
import { AccessControl, Query, Permission } from 'accesscontrol';

var _ = require('lodash');

export class CrudAccessControl {

  ac:AccessControl;

  constructor(private resource:string,  private grants:any){
    this.ac = new AccessControl(grants);
  }

  check(user: any, op: string): Grant {
    var _ac = this.ac;
    //check for `any` clearence: the user has accesss to any document in the target collection
    var grant: Grant;
    var roles = this.filteredRoles(_ac, user.roles);

    var orgRoles = this.getOrgRoles(user);
    orgRoles = this.filteredRoles(_ac, orgRoles);

    l.trace(`check can ${roles} ${op}Any for ${this.resource}`)
    var anyRoles = roles.concat(orgRoles);
    var anyPermission = this.doCheck(_ac, anyRoles, op, 'Any', this.resource);

    if (anyPermission.granted) {
      grant = new Grant(anyPermission, 'any');
      grant.addVerifiedRoles(anyRoles);
    } else {
      //check for `own` clearence:
      var ownGrant = new Grant();

      ///check for `own` clearence for 'user'
      l.trace(`check can ${roles} ${op}Own for ${this.resource}`)
      var userOwnPermission = this.doCheck(_ac, roles, op, 'Own', this.resource);
      ownGrant.addVerifiedRoles(roles);
      //check for `organization:own` clearence
      if (userOwnPermission.granted) {
        ownGrant.addGrant(new Grant(userOwnPermission, 'own', 'user'));
      }

      //check for 'own' clearence for 'organization'
      l.trace(`check can ${orgRoles} ${op}Own for ${this.resource}`)
      var organizationOwnPermission = this.doCheck(_ac, orgRoles, op, 'Own', this.resource);
      if (organizationOwnPermission.granted) {
        ownGrant.addGrant(new Grant(organizationOwnPermission, 'own', 'organization'));
      }

      if (ownGrant.granted) {
        grant = ownGrant;
      } else {
        grant = new Grant(); /* granted false */
      }
    }
    return grant;
  }

  private doCheck(_ac, roles, op, type, resource): Permission {
    var permission;
    try {
      permission = _ac.can(roles)[op + type](resource)
    } catch (err) {
      l.warn(err.message);
      permission = { granted: false };
    }
    return permission;
  };

  private grantOwn;

  // remove inexistent roles
  filteredRoles(_ac, roles) {
    if(_.isEmpty(roles))
      return [];
    return roles.filter((role) => {return _ac.hasRole(role)});
  }

  getOrgRoles(user){
    var orgRoles = [];

    orgRoles = orgRoles.concat(
      _.uniq(user.roles
        .filter(function(role) { return role.indexOf('$organization') == 0; })
        .map(function (role) { return role.replace(/:.*:/, ':'); }))
    );

    return orgRoles;
  }

}

export class Grant {
  granted:boolean = false;
  type:string = 'none'; /* none, any, own */
  ownerTypes:Array<String> = []; /* empty, organziaiton, user*/
  permissions:Array<Permission> = [];
  verifiedRoles:Array<String> = [];

  constructor(permission?, _type?, _ownerType?){
    if(_type){
      this.type = _type;
    }
    this.addPermission(permission);
    this.addOwnerType(_ownerType);
  }

  addGrant(grant:Grant){
    if(!grant) { return; }
    this.type = grant.type;
    this.addPermission(grant.permissions[0]);
    this.addOwnerType(grant.ownerTypes[0]);
  }

  addOwnerType(ownerType){
    if(!ownerType) { return; }
    this.ownerTypes.push(ownerType);
  }

  addPermission(permission:Permission){
    if(!permission || !permission.granted) { return; }
    this.permissions.push(permission);
    this.granted = this.granted || permission.granted;
  }

  addVerifiedRoles(roles:Array<String>){
    if(!roles) { return; }
    this.verifiedRoles = this.verifiedRoles.concat(roles);
  }

}

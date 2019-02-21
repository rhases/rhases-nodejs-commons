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
    l.trace(`all roles of user: ${user.roles}`)

    var grant: Grant;
    var roles = this.filteredRoles(_ac, user.roles);
    l.trace(`filtered user roles: ${roles}`)

    var orgRoles = this.getOrgRoles(user);
    l.trace(`org roles: ${orgRoles}`)
    orgRoles = this.filteredRoles(_ac, orgRoles);
    l.trace(`filtered org roles: ${orgRoles}`)

    var assignedRoles = this.getAssignedRoles(user);
    l.trace(`assignedRoles roles: ${assignedRoles}`)
    assignedRoles = this.filteredRoles(_ac, assignedRoles);
    l.trace(`filtered assignedRoles roles: ${assignedRoles}`)

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
      l.trace(`check can '${roles}' ${op}Own for ${this.resource}`)
      var userOwnPermission = this.doCheck(_ac, roles, op, 'Own', this.resource);
      ownGrant.addVerifiedRoles(roles);
      //check for `organization:own` clearence
      if (userOwnPermission.granted) {
        ownGrant.addGrant(new Grant(userOwnPermission, 'own', 'user'));
      }

      //check for 'own' clearence for 'organization'
      l.trace(`check can '${orgRoles}' ${op}Own for ${this.resource}`)
      var organizationOwnPermission = this.doCheck(_ac, orgRoles, op, 'Own', this.resource);
      if (organizationOwnPermission.granted) {
        ownGrant.addGrant(new Grant(organizationOwnPermission, 'own', 'organization'));
      }

      //check for 'own' clearence for 'assignedRoles'
      l.trace(`check can '${assignedRoles}' ${op}Own for ${this.resource}`)
      
      assignedRoles
        .map(assignedRole => ({ assignedRole, permission: this.doCheck(_ac, [assignedRole], op, 'Own', this.resource) }))
        .filter(rolePermission => rolePermission.permission.granted)
        .map(rolePermission => { l.trace(rolePermission); return rolePermission; })
        .map( ({ assignedRole, permission }) => new Grant(permission, 'own', 'assigned', assignedRole))
        .map(grant => { l.trace(`grant ${JSON.stringify(grant)}`); return grant; })
        .forEach(grant => ownGrant.addGrant(grant));

      l.trace(`ownGrant: '${JSON.stringify(ownGrant)}'`)

      if (ownGrant.granted) {
        grant = ownGrant;
      } else {
        grant = new Grant(); /* granted false */
      }
    }
    return grant;
  }

  private doCheck(_ac: AccessControl, roles, op, type, resource): Permission {
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
  filteredRoles(_ac: AccessControl, roles) {
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

  getAssignedRoles(user) {
    var assignedRoles = [];

    assignedRoles = assignedRoles.concat(
      _.uniq(user.roles
        .filter(function (role) { return role.indexOf('$assigned:') == 0; })
        .map(function (role) { return role.replace(/:.*:/, ':'); }))
    );

    return assignedRoles;
  }

}

export class Grant {
  granted:boolean = false;
  type:string = 'none'; /* none, any, own */
  ownerTypes:Array<String> = []; /* empty, organziaiton, user, assigned */
  permissions:Array<Permission> = [];
  verifiedRoles:Array<String> = [];
  assignedRoles: Array<String> = [];

  constructor(permission?, _type?, _ownerType?, assignedRole?){
    if(_type){
      this.type = _type;
    }
    this.addPermission(permission);
    this.addOwnerType(_ownerType);
    this.addAssignedRole(assignedRole);
  }

  addGrant(grant: Grant): Grant {
    if(!grant) { return; }
    this.type = grant.type;
    this.addPermission(grant.permissions[0]);
    this.addOwnerType(grant.ownerTypes[0]);
    this.assignedRoles = this.assignedRoles.concat(grant.assignedRoles);
    return this;
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

  addAssignedRole(role) {
    if (!role) { return; }
    this.assignedRoles.push(role);
  }

}

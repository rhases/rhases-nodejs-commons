'use strict'

import l from '../logger';
import { AccessControl, Query, Permission } from 'accesscontrol';
import { CrudAccessControl, ExPermission } from './access-control.authorization';
import { Promise } from 'q';

var Q = require('q');
var _ = require('lodash');

export function crudAccessControlWithOrgRolesFactory(resource, grants):Promise<CrudAccessControl>{
  if(!resource || !grants) throw Error('missing parameters');
  var thisGrants = _.cloneDeep(grants);
  thisGrants.forEach(function(grant) { grant.resource = grant.resource|| resource});
  l.warn('--------------####');
  l.warn(thisGrants[0].resource)
  return queryAllOrgs()
  .then(expandGrantsListRules(thisGrants))
  .then(instantiateCrudAccessControl(resource))

}

function queryAllOrgs(){
  l.trace('listing orgs');
  return Q.when([ {
    code: 'vert'
  }, {
    code: 'rhases'
  },{
    code: 'tass'
  }])
}

function expandGrantsListRules(grants){
  return function(organizations:Array<any> ){
    l.trace('expanding grants');
    return grants.reduce(function(acc, grant){
      if( _.startsWith(grant.role, '$organization') ){
        l.trace('grant to be expanded');
        var orgRole = grant.role.slice('$organizationa'.length);
        var grunts = organizations.map(function(organization){
          var newGrant = _.clone(grant);
          newGrant.role = `${organization.code}:${orgRole}`;
          l.trace(`grants added with role ${newGrant.role}`);
          return newGrant;
        })
        acc = _.concat(acc, grunts)
      }else {
        l.trace(`grants added as is '${grant.role}'`);
        acc.push(grant);
      }
      return acc;
    }, [])
  }
}

function instantiateCrudAccessControl(resource){
  return function(grants){
    l.trace(`instantiate CrudAccessControl '${resource}' and '${grants.length} grants'`);
    return new CrudAccessControl(resource, grants);
  }
}

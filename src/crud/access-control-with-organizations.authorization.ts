'use strict'

import l from '../logger';
import { CrudAccessControl } from './access-control.authorization';
import { Promise } from 'q';

var Q = require('q');
var _ = require('lodash');

export function crudAccessControlWithOrgRolesFactory(resource, grants):Promise<CrudAccessControl>{
  if(!resource || !grants) throw Error('missing parameters');
  var thisGrants = _.cloneDeep(grants);
  thisGrants.forEach(function(grant) { grant.resource = grant.resource || resource});
  return Q.when(thisGrants)
    .then(instantiateCrudAccessControl(resource));
}

function instantiateCrudAccessControl(resource){
  return function(grants){
    l.trace(`instantiate CrudAccessControl '${resource}' and '${grants.length} grants'`);
    return new CrudAccessControl(resource, grants);
  }
}


import { expect } from 'chai';

import * as mocha from 'mocha';

import { CrudAccessControl } from './access-control.authorization';
import l from '../logger';
import { crudAccessControlWithOrgRolesFactory } from './access-control-with-organizations.authorization';

var Q = require('q');
import { Promise } from 'q';

describe('[Access Control]', () => {
    var promisedAcessControl: Promise<CrudAccessControl>;
    var newVideo, myVideo, videoFromThirdPary, adminUser, normalUser, organizationManager, organizationMember, guestUser;
    var queryMock;

    promisedAcessControl = crudAccessControlWithOrgRolesFactory('video', [
      { role: 'guest', resource: 'catalog', action: 'read:any', attributes: ['*'] },

      { role: 'admin', resource: 'video', action: 'create:any', attributes: ['*'] },
      { role: 'admin', resource: 'video', action: 'read:any', attributes: ['*'] },
      { role: 'admin', resource: 'video', action: 'update:any', attributes: ['*'] },
      { role: 'admin', resource: 'video', action: 'delete:any', attributes: ['*'] },

      { role: 'user', resource: 'video', action: 'read:own', attributes: ['*'] },

      { role: '$organization:member', resource: 'video', action: 'read:own', attributes: ['*'] },
      { role: '$organization:member', resource: 'video', action: 'update:own', attributes: ['*'] },

      { role: '$organization:manager', resource: 'video', action: 'create:own', attributes: ['*'] },
      { role: '$organization:manager', resource: 'video', action: 'read:own', attributes: ['*'] },
      { role: '$organization:manager', resource: 'video', action: 'update:own', attributes: ['*'] },
      { role: '$organization:manager', resource: 'video', action: 'delete:own', attributes: ['*'] }
    ]);

    organizationManager = {
      _id: '001',
      roles: ['user'],
      organization: {
        ref: {code:'vert'},
        role: 'manager'
      }
    };

    organizationMember = {
      _id: '002',
      roles: ['user'],
      organization: {
        ref: {code:'vert'},
        role: 'member'
      }
    };

    normalUser = {
      _id: '100',
      roles: ['user']
    };

    it('should organization manager be grant create access', () => {
      return promisedAcessControl
      .then(function(accessControll){
        return accessControll.check(organizationManager, 'create')
      })
      .then(function(grant){
        l.trace('asserting permission attrs')
        expect(grant.granted).to.equal(true);
        expect(grant.type).to.equal('own');
        expect(grant.ownerTypes).to.include.members(['organization']);
      })
    });

    it('should organization member be grant update access', () => {
      return promisedAcessControl
      .then(function(accessControll){
        return accessControll.check(organizationManager, 'update')
      })
      .then(function(grant){
        l.trace('asserting permission attrs')
        expect(grant.granted).to.equal(true);
        expect(grant.type).to.equal('own');
        expect(grant.ownerTypes).to.include.members(['organization']);
      })
    });

    it('should organization member not be grant read write access', () => {
      return promisedAcessControl
      .then(function(accessControll){
        return accessControll.check(organizationMember, 'create')
      })
      .then(function(grant){
        l.trace('asserting permission attrs')
        expect(grant.granted).to.equal(false);
      })
    });

    it('should organization member be grant read access for user:own and organization:own', () => {
      return promisedAcessControl
      .then(function(accessControll){
        return accessControll.check(organizationMember, 'read')
      })
      .then(function(grant){
        l.trace('asserting permission attrs')
        expect(grant.granted).to.equal(true);
        expect(grant.type).to.equal('own');
        expect(grant.ownerTypes).to.include.members(['organization', 'user']);
      })
    });
});

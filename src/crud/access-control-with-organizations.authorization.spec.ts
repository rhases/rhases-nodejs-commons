
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

      { role: 'user', resource: 'video', action: 'read:any', attributes: ['*'] },

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

    newVideo = {
      title: 'Star Wars Episode IX',
    };

    myVideo = {
      title: 'Fight Club',
      owner: {userId: "001"}
    };

    videoFromThirdPary = {
      title: 'The Godfather',
      owner: {userId: "301"}
    };

    queryMock = {
      where:{ or: () =>{}}
    };

    it('should organization manager be grant create access', () => {
      return promisedAcessControl
      .then(function(accessControll){
        return accessControll.check(organizationManager, 'create')
      })
      .then(function(permission){
        l.trace('asserting permission attrs')
        expect(permission.granted).to.equal(true);
        expect(permission.for).to.equal('organization');
        expect(permission.type).to.equal('own');
      })
    });

    it('should organization member be grant update access', () => {
      return promisedAcessControl
      .then(function(accessControll){
        return accessControll.check(organizationManager, 'update')
      })
      .then(function(permission){
        l.trace('asserting permission attrs')
        expect(permission.granted).to.equal(true);
        expect(permission.for).to.equal('organization');
        expect(permission.type).to.equal('own');
      })
    });

    it('should organization member not be grant read write access', () => {
      return promisedAcessControl
      .then(function(accessControll){
        return accessControll.check(organizationMember, 'create')
      })
      .then(function(permission){
        l.trace('asserting permission attrs')
        expect(permission.granted).to.equal(false);
      })
    });
});

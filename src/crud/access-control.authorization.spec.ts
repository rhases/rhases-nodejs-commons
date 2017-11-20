
import { expect } from 'chai';

import * as mocha from 'mocha';

import { CrudAccessControl } from './access-control.authorization';
import l from '../logger';



describe('[Access Control]', () => {
    var accessControll: CrudAccessControl;
    var newVideo, myVideo, videoFromThirdPary, adminUser, adminUserWithOtherOtherRole, normalUser, organizationManager, guestUser;
    var queryMock;

    accessControll = new CrudAccessControl('video', [
      { role: 'guest', resource: 'catalog', action: 'read:any', attributes: ['*'] },

      { role: 'admin', resource: 'video', action: 'create:any', attributes: ['*'] },
      { role: 'admin', resource: 'video', action: 'read:any', attributes: ['*'] },
      { role: 'admin', resource: 'video', action: 'update:any', attributes: ['*'] },
      { role: 'admin', resource: 'video', action: 'delete:any', attributes: ['*'] },

      { role: 'user', resource: 'video', action: 'create:own', attributes: ['*'] },
      { role: 'user', resource: 'video', action: 'read:any', attributes: ['*'] },
      { role: 'user', resource: 'video', action: 'update:own', attributes: ['*'] },
      { role: 'user', resource: 'video', action: 'delete:own', attributes: ['*'] },

      { role: '$organization:manager', resource: 'video', action: 'read:any', attributes: ['*'] },
      { role: '$organization:manager', resource: 'video', action: 'create:own', attributes: ['*'] },
      { role: '$organization:manager', resource: 'video', action: 'update:own', attributes: ['*'] },
      { role: '$organization:manager', resource: 'video', action: 'delete:own', attributes: ['*'] }
    ]);

    adminUser = {
      _id: '001',
      roles: ['admin']
    };

    adminUserWithOtherOtherRole = {
      _id: '0010',
      roles: ['admin', 'other1', 'other2']
    };

    organizationManager = {
      _id: '001',
      roles: ['user'],
      organization: {
        ref: {code:'vert'},
        role: 'manager'
      }
    };

    normalUser = {
      _id: '100',
      roles: ['user']
    };

    guestUser = {
      _id: '200',
      roles: ['guest']
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

    it('admin should be allowed to create video for any', () => {
      var grant = accessControll.check(adminUser, 'read');
      expect(grant.granted).to.equal(true);
      expect(grant.type).to.equal('any');
      expect(grant.ownerTypes).to.be.empty;
    });

    it('admin with not declared role bug test', () => {
      var grant = accessControll.check(adminUserWithOtherOtherRole, 'read');
      console.log("NOT DECLARED" + JSON.stringify(grant));
      expect(grant.granted).to.equal(true);
      expect(grant.type).to.equal('any');
      expect(grant.ownerTypes).to.be.empty;
    });

    it('user should be allowed to create video of its own', () => {

      var grant = accessControll.check(normalUser, 'create');
      expect(grant.granted).to.equal(true);
      expect(grant.type).to.equal('own');
      expect(grant.ownerTypes).to.include.members(['user']);
    });
    //
    it('guest should not be allowed to create video', () => {
      var grant = accessControll.check(guestUser, 'create');
      expect(grant.granted).to.equal(false);
    });
    //
    it('admin should be allowed to update any video', () => {
      var grant = accessControll.check(adminUser, 'update');
      expect(grant.granted).to.equal(true);
    });

});

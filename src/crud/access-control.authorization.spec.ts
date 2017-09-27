
import { expect } from 'chai';

import * as mocha from 'mocha';

import { CrudAccessControl } from './access-control.authorization';
import l from '../logger';



describe('[Access Control]', () => {
    var accessControll: CrudAccessControl;
    var newVideo, myVideo, videoFromThirdPary, adminUser, normalUser, guestUser;
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
      { role: 'user', resource: 'video', action: 'delete:own', attributes: ['*'] }
    ]);

    adminUser = {
      _id: '001',
      roles: ['admin']
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
      var permission = accessControll.check(adminUser, 'read');
      expect(permission.granted).to.equal(true);
      expect(permission.for).to.equal('user');
      expect(permission.type).to.equal('any');
    });

    it('user should be allowed to create video of its own', () => {

      var permission = accessControll.check(normalUser, 'create');
      expect(permission.granted).to.equal(true);
      expect(permission.for).to.equal('user');
      expect(permission.type).to.equal('own');
    });
    //
    it('guest should not be allowed to create video', () => {
      var permission = accessControll.check(guestUser, 'create');
      expect(permission.granted).to.equal(false);
    });
    //
    it('admin should be allowed to update any video', () => {
      var permission = accessControll.check(adminUser, 'update');
      expect(permission.granted).to.equal(true);
    });

});

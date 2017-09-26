
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

    it('admin should be allowed to create video', () => {
      var req = {
        user: adminUser
      }
      return accessControll.checkCreate(req)
      .then(function(check){
          expect(check.isGranted).to.equal(true);
          //do not overwrite owner
          expect(check.setBeforeUpdate(videoFromThirdPary).owner.userId).to.equal('301');
      })
    });

    it('user should be allowed to create video of its own', () => {
      var req = {
        user: normalUser
      }
      return accessControll.checkCreate(req)
      .then(function(check){
          expect(check.isGranted).to.equal(true);
          l.trace(check.setBeforeUpdate(newVideo))
          expect(check.setBeforeUpdate(newVideo).owner.userId).to.equal('100');
      })
    });

    it('guest should not be allowed to create video', () => {
      var req = {
        user: guestUser
      }

      return accessControll.checkCreate(req)
      .then(function(check){
        throw new Error('test failure');
      }).catch(function(err){
        expect(err.message).to.equal("user has no permission to create video");
      })

    });

    it('admin should be allowed to update any video', () => {
      var req = {
        user: adminUser
      }
      return accessControll.checkUpdate(req)
      .then(function(check){
          expect(check.isGranted).to.equal(true);
          //expect(check.applyQueryRestriction({})).to.be.empty;
      })
    });

    it('user should be allowed to update its own video', () => {
      var req = {
        user: normalUser
      }
      return accessControll.checkUpdate(req)
      .then(function(check){
          expect(check.isGranted).to.equal(true);
      })
    });

});

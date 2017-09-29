
import { expect } from 'chai';

import * as mocha from 'mocha';

import { ifGrantedForUser, ifGrantedForOrganization }  from './promise-grants.utils';

import l from '../logger';


describe('[Promise Grants]', () => {

    function double(num1){
      return num1 + num1;
    }

    function quad(num1){
      return 4*num1;
    }

    var permissionForUserMock = {
      type:'own', for:'user'
    }

    it('should return func if is granted for user', () => {
      var result = ifGrantedForUser(permissionForUserMock, double)(4)
      expect(result).to.be.equals(8)
    });

    it('should return identity if is granted for organization', () => {
      var result = ifGrantedForOrganization(permissionForUserMock, double)(4)
      expect(result).to.be.equals(4)
    });

});

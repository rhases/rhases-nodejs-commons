
import { expect } from 'chai';

import * as mocha from 'mocha';

import { ifGrantedForUser, ifGrantedForOrganization, ifDefined }  from './promise-grants.utils';
import { Grant } from '../crud/access-control.authorization';

import l from '../logger';


describe('[Promise Grants]', () => {

    function double(num1){
      return num1 + num1;
    }

    function quad(num1){
      return 4*num1;
    }

    var permissionForUserMock = new Grant({granted:true}, 'own', 'user');

    it('should return func if is granted for user', () => {
      var result = ifGrantedForUser(permissionForUserMock, double)(4)
      expect(result).to.be.equals(8)
    });

    it('should return identity if is granted for organization', () => {
      var result = ifGrantedForOrganization(permissionForUserMock, double)(4)
      expect(result).to.be.equals(4)
    });

    it('idDefined: should return func if defined', () => {
      var result = ifDefined(double)(4)
      expect(result).to.be.equals(8)
    });

    it('idDefined: should return identity if not defined', () => {
      var result = ifDefined(undefined)(4)
      expect(result).to.be.equals(4)
    });
});

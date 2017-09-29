
import { expect } from 'chai';

import { concatFunctions, now } from './functions.utils'

import l from '../logger';

describe('functions', () => {

    function double(num1){
      return num1 + num1;
    }

    function quad(num1){
      return 4*num1;
    }

    function divideBy0(num1){
      throw new Error('divide by 0');
    }

    it('should use first if defined', () => {

      var result = concatFunctions(double, undefined)(2);
      expect(result).to.be.equal(4);
    })
    it('should use second if defined', () => {

      var result = concatFunctions(undefined, quad)(2);
      expect(result).to.be.equal(8);
    })
    it('should use both if both are defined', () => {

      var result = concatFunctions(double, quad)(2);
      expect(result).to.be.equal(16);
    })
    it('should be identity if none is defined', () => {

      var result = concatFunctions(undefined, undefined)(2);
      expect(result).to.be.equal(2);
    })

    it('now should call then functions in chain', () => {

      var result = now(5)
      .then(double)
      .then(quad)
      .value();

      expect(result).to.be.equal(40);
    })

    it('now should call err function', () => {
      var error;
      var result = now(5)
      .then(double)
      .then(divideBy0)
      .then(quad)
      .catch(function(err) {error = err})
      .value();

      expect(error.message).to.be.equal('divide by 0');
      expect(result).to.be.undefined;
    })

});

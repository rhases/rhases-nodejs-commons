import * as MyModule from '../index';
import {expect, use} from 'chai';
import * as ChaiString from 'chai-string';

use(ChaiString);

describe('My Module', () => {
    describe('People', () => {
        let joe: MyModule.Person;

        before(() => {
            joe = new MyModule.Person('Joe');
        });

        it('should have names', (done) => {
            expect(joe.fullName).to.startWith('Joe');
            done();
        });

        it('should be the only member in their family', (done) => {
            expect(joe.family.size).to.equal(1);
            done();
        });

        it('should be orphans by default', (done) => {
            expect(joe.fullName).to.endWith('Orphan');
            done();
        });
    });

    describe('Families', () => {
        let bob: MyModule.Person;
        let bigHappyFamily: MyModule.Family;

        before(() => {
            bob = new MyModule.Person('Bob');
            bigHappyFamily = new MyModule.Family('Barker');
        });

        it('should have a name', (done) => {
            expect(bigHappyFamily.name).to.equal('Barker');
            done();
        });

        it('should be empty by default', (done) => {
            expect(bigHappyFamily.size).to.equal(0);
            done();
        });

        it('should let people join and change their last names', (done) => {
            expect(bob.fullName).to.equal('Bob Orphan');
            bigHappyFamily.addMember(bob);
            expect(bigHappyFamily.size).to.equal(1);
            expect(bob.family).to.equal(bigHappyFamily);
            expect(bob.fullName).to.equal('Bob Barker');
            done();
        });
    });
});

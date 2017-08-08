"use strict";
const MyModule = require('../index');
const chai_1 = require('chai');
const ChaiString = require('chai-string');
chai_1.use(ChaiString);
describe('My Module', () => {
    describe('People', () => {
        let joe;
        before(() => {
            joe = new MyModule.Person('Joe');
        });
        it('should have names', (done) => {
            chai_1.expect(joe.fullName).to.startWith('Joe');
            done();
        });
        it('should be the only member in their family', (done) => {
            chai_1.expect(joe.family.size).to.equal(1);
            done();
        });
        it('should be orphans by default', (done) => {
            chai_1.expect(joe.fullName).to.endWith('Orphan');
            done();
        });
    });
    describe('Families', () => {
        let bob;
        let bigHappyFamily;
        before(() => {
            bob = new MyModule.Person('Bob');
            bigHappyFamily = new MyModule.Family('Barker');
        });
        it('should have a name', (done) => {
            chai_1.expect(bigHappyFamily.name).to.equal('Barker');
            done();
        });
        it('should be empty by default', (done) => {
            chai_1.expect(bigHappyFamily.size).to.equal(0);
            done();
        });
        it('should let people join and change their last names', (done) => {
            chai_1.expect(bob.fullName).to.equal('Bob Orphan');
            bigHappyFamily.addMember(bob);
            chai_1.expect(bigHappyFamily.size).to.equal(1);
            chai_1.expect(bob.family).to.equal(bigHappyFamily);
            chai_1.expect(bob.fullName).to.equal('Bob Barker');
            done();
        });
    });
});
//# sourceMappingURL=module-test.js.map
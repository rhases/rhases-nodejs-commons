"use strict";
const Family_1 = require('./Family');
class Person {
    constructor(name) {
        this.name = name;
        this.family = new Family_1.Family('Orphan');
        this.family.addMember(this);
    }
    sayHello() {
        return `${this.name}> hello!`;
    }
    setFamily(family) {
        this.family = family;
    }
    get fullName() {
        return `${this.name} ${this.family.name}`;
    }
}
exports.Person = Person;
//# sourceMappingURL=Person.js.map
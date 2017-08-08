"use strict";
class Family {
    constructor(name) {
        this.name = name;
        this.members = [];
    }
    addMember(person) {
        person.setFamily(this);
        this.members.push(person);
    }
    get size() {
        return this.members.length;
    }
}
exports.Family = Family;
//# sourceMappingURL=Family.js.map
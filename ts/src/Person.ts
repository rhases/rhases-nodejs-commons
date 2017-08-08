import {Family} from './Family';

export class Person {
    public name: string;
    public family: Family;

    public constructor(name: string) {
        this.name = name;

        // Everybody is in an orphaned family by default. How sad...
        this.family = new Family('Orphan');
        this.family.addMember(this);
    }

    public sayHello(): string {
        return `${this.name}> hello!`;
    }

    public setFamily(family: Family): void {
        this.family = family;
    }

    public get fullName(): string {
        return `${this.name} ${this.family.name}`;
    }
}

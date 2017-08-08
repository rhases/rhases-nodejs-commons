import {Person} from './Person';

export class Family {
    public name: string;
    public members: Person[];

    public constructor(name: string) {
        this.name = name;
        this.members = [];
    }

    public addMember(person: Person): void {
        person.setFamily(this);
        this.members.push(person);
    }

    public get size(): number {
        return this.members.length;
    }
}

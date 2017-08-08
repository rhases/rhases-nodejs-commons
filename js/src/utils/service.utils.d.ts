import { Model, Document, DocumentQuery } from 'mongoose';
export declare class ServiceUtils {
    private model;
    constructor(model: Model<Document>);
    all(): any;
    byId(id: any): any;
    create(data: any): any;
    update(id: any, data: any): any;
    remove(id: any): any;
    createQueryExecutor(queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>): any;
    execFind(queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>, sortBy: string, currentPage: number, perPage: number): any;
    execCount(queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>): any;
    saveUpdates(updates: any): (entity: any) => any;
    removeEntity(): (entity: any) => any;
}

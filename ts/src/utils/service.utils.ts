import l from '../logger';
import { Model, Document, DocumentQuery } from 'mongoose';


export class ServiceUtils {

  constructor(private model: Model<Document>) {
  }

  all() {
    l.info(`${this.model.collection.collectionName}.all()`);

    return this.model
      .find()
      .exec()
  }

  byId(id: any) {
    l.info(`${this.model.collection.collectionName}.byId(${id})`);

    return this.model
      .findById(id)
      .exec()
  }

  create(data: any) {
    l.info(data, `${this.model.collection.collectionName}.create(${data})`);

    return this.model.create(data);
  }

  update(id: any, data: any) {
    l.info(data, `${this.model.collection.collectionName}.update(${data})`);

    if (data._id)
      delete data._id;

    return this.model
      .findById(id)
      .exec()
      .then(this.saveUpdates(data));
  }

  remove(id: any) {
    l.info(id, `${this.model.collection.collectionName}.remove(${id})`);

    return this.model
      .findById(id)
      .exec()
      .then(this.removeEntity());
  }

  createQueryExecutor(queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>) {
    var self = this;
    var executor: any = {};
    executor.execCount = function () {
      return self.execCount(queryBuilder);
    };
    executor.execFind = function (sortBy: string, currentPage: number, perPage: number) {
      return self.execFind(queryBuilder, sortBy, currentPage, perPage);
    }
    return executor;
  }

  //Query utils
  execFind(queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>, sortBy: string, currentPage: number, perPage: number) {
    l.info(queryBuilder, `${this.model.collection.collectionName}.execFind()`);
    var query = queryBuilder(this.model.find());
    if (sortBy)
      query.sort(sortBy);

    if (currentPage > 0 && perPage > 0)
      query
        .skip((currentPage - 1) * perPage)
        .limit(perPage);

    return query.exec();
  }

  execCount(queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>) {
    l.info(queryBuilder, `${this.model.collection.collectionName}.execCount()`);
    return queryBuilder(this.model.count(null)).exec();
  }
  //Query utils

  saveUpdates(updates: any) {
    return function (entity: any) {
      if (!entity) return;

      var updated = entity.merge(updates);
      return updated.save()
        .then((result: any) => {
          return result;
        });
    };
  }

  removeEntity() {
    return function (entity: any) {
      if (!entity) return;

      return entity.remove()
        .then((removed : any) => {
          return removed;
        });
    };
  }
}

import l from '../logger';
import { Model, Document, DocumentQuery } from 'mongoose';


export function createQueryExecutor(model: Model<Document>, queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>) {
  var self = this;
  var executor: any = {};
  executor.execCount = function () {
    return self.execCount(model, queryBuilder);
  };
  executor.execFind = function (sortBy: string, currentPage: number, perPage: number) {
    return self.execFind(model, queryBuilder, sortBy, currentPage, perPage);
  }
  return executor;
}

//Query utils
export function execFind(model: Model<Document>, queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>, sortBy: string, currentPage: number, perPage: number) {
  l.info(queryBuilder, `${model.collection.collectionName}.execFind()`);
  var query = queryBuilder(model.find());
  if (sortBy)
    query.sort(sortBy);

  if (currentPage > 0 && perPage > 0)
    query
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

  return query.exec();
}

export function execCount(model: Model<Document>, queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>) {
  l.info(queryBuilder, `${model.collection.collectionName}.execCount()`);
  return queryBuilder(model.count(null)).exec();
}

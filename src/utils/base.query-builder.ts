'use strict'


import l from '../logger';
var Q = require('q');
import { Model, Document, DocumentQuery } from 'mongoose';
import { Request, Response } from 'express';

export function setBasicQueries(schema){

  schema.query.byUser = function(user) {
    if (user)
      this.where("userId").eq(user._id);
    return this;
  };

  return schema;
}
//export var TicketSchema;

export function createQueryExecutor(model: Model<Document>, queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>) {
  var self = this;
  var executor: any = {};
  executor.execCount = function () {
    return self.execCount(model, queryBuilder);
  };
  executor.execFind = function (sortBy: string, currentPage: number, perPage: number) {
    return self.execFind(model, queryBuilder, sortBy, currentPage, perPage);
  }
  return Q.when(executor);
}

export function execFindAndCound(query:any, res: Response) {
  return function(queryExecutor: any) {
    var sortBy = query.sort;
    var currentPage = query.page || 1;
    var perPage = query.per_page || 200;

    return queryExecutor
      .execCount()
      .then(function(totalCount:number) {
        res.set('X-Total-Count', String(totalCount));
        return queryExecutor.execFind(sortBy, currentPage, perPage);
      })
  }
}

//Query utils
export function execCount(model: Model<Document>, queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>) {
  l.info(queryBuilder, `${model.collection.collectionName}.execCount()`);
  return queryBuilder(model.count(null)).exec();
}

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
export function execFindByIdWithQueryBuilder(model: Model<Document>, id, queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>) {
  var self = this;
  return queryBuilder(model.findById(id))
  .exec();
}

'use strict'


import l from '../logger';
var Q = require('q');
import { Model, Document, DocumentQuery } from 'mongoose';
import { Request, Response } from 'express';
import { concatFunctions} from './functions.utils';

export function setBasicQueries(schema){

  schema.query.byUser = function(user) {
    if (user)
      this.where("userId").eq(user._id);
    return this;
  };

  return schema;
}
//export var TicketSchema;

export function createQueryExecutor(model: Model<Document>, _queryBuilder?: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>) {
  var self = this;
  return function(__queryBuilder?) {
    //query builder func could be setted as param internal, external or both.
    var queryBuilder = concatFunctions(_queryBuilder, __queryBuilder);
    var executor: any = {};
    executor.execCount = function () {
      return self.execCount(model, queryBuilder);
    };
    executor.execFind = function (sortBy: string, currentPage: number, perPage: number) {
      return self.execFind(model, queryBuilder, sortBy, currentPage, perPage);
    }
    l.trace('query executor created');
    return executor;
  }
}

export function execFindAndCount(query:any, res: Response) {
  return function(queryExecutor: any) {
    l.trace(`executing find and count ${queryExecutor}`);
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
  l.trace(typeof queryBuilder);
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

export function execQuery(dQuery: DocumentQuery<any,any>){
  return dQuery.exec();
}

export function createFindByIdQuery(model:Model<Document>, id:any){
  return function(){
    return model.findById(id)
  }
}


export function execFindByIdWithQueryBuilder(model: Model<Document>, id) {
  return function(queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>){
    return queryBuilder(model.findById(id))
    .exec();
  }
}

export function restrictByOwner(ownerTypes, userId?, organizationId?){
  let restrictions = [];
  if(ownerTypes.indexOf('user') >= 0 ){
    restrictions.push({ "owner.userId": userId });
  }

  if(ownerTypes.indexOf('organization') >= 0 ){
    restrictions.push({ "owner.organizationId": organizationId });
  }

  return function(query:DocumentQuery<any, any>): DocumentQuery<any, any>{
    if(restrictions.length == 0){ return query;}
    if(restrictions.length == 1) {
      return query.where(restrictions[0])
    }else{
      return query.or(restrictions);
    }
  }
}

// deprecated
export function restrictByUserOwner(user){
  return function(query:DocumentQuery<any, any>): DocumentQuery<any, any>{
    return query.where("owner.userId").equals(user._id);
  }
}

// deprecated
export function restrictByOrganizationOwner(user){
  return function(query:DocumentQuery<any, any>): DocumentQuery<any, any>{
    return query.where("owner.organizationId").equals(user.owner.organization.ref.code);
  }
}

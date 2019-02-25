'use strict'


import l from '../logger';
var Q = require('q');
var _ = require('lodash');
import { Model, Document, DocumentQuery } from 'mongoose';
import { Response } from 'express';
import { concatFunctions} from './functions.utils';

export function setBasicQueries(schema) {

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
    executor.execFind = function (sortBy: string, currentPage: number, perPage: number, populate: string, isLean?: boolean) {
      return self.execFind(model, queryBuilder, sortBy, currentPage, perPage, populate, isLean);
    }
    l.trace('query executor created');
    return executor;
  }
}

export function execFindAndCount(query: any, res: Response, isLean?: boolean) {
  return function(queryExecutor: any) {
    l.trace(`executing find and count ${queryExecutor}`);
    var sortBy = query.sort;
    var currentPage = query.page || 1;
    var perPage = query.per_page || 200;
    var populate = query.populate || '';

    return queryExecutor
      .execCount()
      .then(function(totalCount:number) {
        res.set('X-Total-Count', String(totalCount));
        return queryExecutor.execFind(sortBy, currentPage, perPage, populate, isLean);
      })
  }
}

//Query utils
export function execCount(model: Model<Document>, queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>) {
  l.trace(queryBuilder, `${model.collection.collectionName}.execCount()`);
  l.trace(typeof queryBuilder);
  return queryBuilder(model.count(null)).exec();
}

export function execFind(model: Model<Document>, queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>, 
  sortBy: string, currentPage: number, perPage: number, populate: string, isLean?: boolean) {
  l.trace(queryBuilder, `${model.collection.collectionName}.execFind()`);
  var query = queryBuilder(model.find());
  if (sortBy)
    query.sort(sortBy);

  if (populate)
    query.populate(getPopulateObject(populate));

  if (currentPage > 0 && perPage > 0)
    query
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .lean(isLean);
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


export function execFindByIdWithQueryBuilder(model: Model<Document>, id, isLean?:boolean) {
  return function(queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>){
    return queryBuilder(model.findById(id))
    .lean(isLean)
    .exec()
  }
}

export function execfindOneAndUpdateWithQueryBuilder(model: Model<Document>, id, update:any) {
  return function (queryBuilder: (query: DocumentQuery<any, any>) => DocumentQuery<any, any>) {
    return queryBuilder(model.findByIdAndUpdate(id, update, { new: true }))
      .exec();
  }
}

export function restrictByOwner(ownerTypes, userId?, organizationCodes?, assignedRole?){
  let restrictions = [];
  l.trace(`restricting query for ${JSON.stringify(ownerTypes)}`);

  if(ownerTypes.indexOf('user') >= 0 ){
    restrictions.push({ "owner.userId": userId });
  }

  if (ownerTypes.indexOf('role') >= 0) {
    restrictions.push({ 'owner.userId': userId });
  }

  if(ownerTypes.indexOf('organization') >= 0 ) {
    restrictions.push({ 'owner.organizationCode': { $in: organizationCodes }});
  }

  if (ownerTypes.indexOf('assigned') >= 0) {
    l.trace(`restricting query for assigned ${JSON.stringify(assignedRole)}`);
    restrictions.push({ [`owner.${assignedRole}`]: userId });
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

function getPopulateObject(populatePathParam) {
  let completePaths = populatePathParam
    .split(',')
    .map((s) => s.trim());
    
  let populates = [];
  completePaths.forEach(function(completePath) {
    let paths = escapeInsideDots(completePath) // escape dots inside brakets ('xxx.[kkk.zzz]' => 'xxx.[kkk*zzz]')
        .split('.') // ('xxx.[kkk*zzz]' => ['xxx', '[kkk*zzz]'])
        .map((s) => s.replace('*', '.')) // unscape dots (['xxx', '[kkk*zzz]'] => ['xxx', '[kkk.zzz]'])
        .map((s) => s.replace(/[\[\]]/g, '')) // remove brakets (['xxx', '[kkk.zzz]'] => ['xxx', 'kkk.zzz'])
        

    paths.reduce(function(fieldsToPopulate, path) {
      let p = _.find(fieldsToPopulate, { path: path })
      if(!p) {
        p = { path: path, populate: [] };
        fieldsToPopulate.push(p);
      }
      return p.populate;
    }, populates);
  });

  return populates;
}

function escapeInsideDots(path) {
    if (!path) return;
    var insideBrackets = false;
    var escapedPath = "";
    for(var i = 0; i < path.length; i++) {
        var c = path[i];
        if (c == '[') insideBrackets = true;
        if (c == ']') insideBrackets = false;        
        
        if (c == '.' && insideBrackets == true) c = '*';
        
        escapedPath += c;
    }
    return escapedPath;
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
    return query.where("owner.organizationCode").equals(user.organization.ref.code);
  }
}


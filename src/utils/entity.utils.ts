'use strict';

import { Model, Document, DocumentQuery } from 'mongoose';
var Q = require('q');

import l from '../logger';
var _ = require("lodash");
var createError = require('http-errors');

export function findEntityById(model: Model<Document>, id) {
  return model.findById(id)
    .exec()
}

export function applyUpdate(updates) {
  return function (entity) {
    if (!entity) return;

    var updated = entity.merge(updates);
    return updated.save()
      .then((result) => {
        return result;
      });
  };
}

export function applyPatch(patches) {
  return function (entity) {
    if(!_.isArray(patches)){
      l.warn('trying to apply patches, but patches are not an array!')
      patches = [patches];
    }
    return patchAsPromised(entity, patches)
    .then((result)=>{
      l.trace(result);
      return result;
    });
  };
}

export function patchAsPromised(entity, patches){
    var def = Q.defer();
    entity.patch(patches, function callback(err, result, number) {
      if(!err) {
        l.trace(`patched documents ${number}`);
        def.resolve(result)
      }else{
        l.trace(`patch rejected ${err}`);
        def.reject(createError(400, err))
      }
  });
  return def.promise;
}


export function updateByIdWithCommandAsPromised(entity: Model<any>, id:any, update:any) {
  var def = Q.defer();
  entity.findByIdAndUpdate(id, update, {}, function callback(err, result) {
    if (!err) {
      l.trace(`updated documents`);
      l.trace(result);
      def.resolve(result)
    } else {
      l.trace(`updated rejected ${err}`);
      def.reject(createError(400, err))
    }
  });
  return def.promise;
}

export function removeEntity() {
  return function (entity) {
    if (!entity) return;

    return entity.remove()
      .then((removed) => {
        return removed;
      });
  };
}

export function createEntity(model: Model<Document>) {
  return function(entity){
    l.trace('creating entity...');
    l.trace(entity);
    return model.create(entity)
  }
}

export function setUserOwner(user): (any) => any {
  return function(entity){
    if(!entity.owner){ entity.owner = {}; }
    l.trace('setting user as owner');
    entity.owner.userId = user._id;
    return entity;
  }
}

export function setOrganizationOwner(user): (any) => any {
  return function(entity){
    if(!entity.owner){ entity.owner = {}; }
    entity.owner.organizationCode = user.organization.ref;
    return entity;
  }
}

export function attributesFilter(filterHolder){
  return function(entity){
    return filterHolder.filter(entity);
  }
}

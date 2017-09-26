'use strict';

import { Model, Document, DocumentQuery } from 'mongoose';
var Q = require('q');

import l from '../logger';
var _ = require("lodash");

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

function patchAsPromised(entity, patches){
    var def = Q.defer();
    entity.patch(patches, function callback(err, result, number) {
      if(err) {
        l.trace(`patch rejected ${err}`);
        def.reject(err)
      }
      l.trace(`patched documents ${number}`);
      def.resolve(result.toObject())
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
    return model.create(entity)
  }
}

export function findEntityById(model: Model<Document>, id) {
  return model.findById(id)
    .exec()
}

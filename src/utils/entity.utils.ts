'use strict';

import { Model, Document, DocumentQuery } from 'mongoose';
var Q = require('q');

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

export function applyPatch(patch) {
  return function (entity) {
    console.log('----- entity ----');
    console.log(entity);
    if (!entity) return;
    console.log(JSON.stringify(patch));
    var def = Q.defer();
    return entity.patch(patch)
    //   , function callback(err) {
    //   if(err) {
    //     console.log(err);
    //     Q.reject(err)
    //   }
    //   console.log('ok');
    //   Q.resolve('ok')
    // })
    // return def.promise.then((result) => {
    //   console.log('----- result ----');
    //   console.log(result);
    //   return result;
    // });
  };
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

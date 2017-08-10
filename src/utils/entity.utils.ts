'use strict';

import { Model, Document, DocumentQuery } from 'mongoose';


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

'use strict'

import { Model, Document, DocumentQuery } from 'mongoose';

export function setBasicQueries(schema){

  schema.query.byUser = function(user) {
    if (user)
      this.where("userId").eq(user._id);
    return this;
  };

  return schema;
}
//export var TicketSchema;
export function queryBuilder(model: Model<Document>):any {
  return model.find();
}

'use strict';

var mongoose = require('mongoose');

export function OwnerSchemaFactory(){
	return new mongoose.Schema({
	organizationCode: { type: String, index: true },
	userId: { type: String, index: true },
 },{ _id : false });
}

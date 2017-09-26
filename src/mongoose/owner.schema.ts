'use strict';

var mongoose = require('mongoose');

export function OwnerSchemaFactory(){
	return new mongoose.Schema({
	 organizationId: String,
	 userId: String // email
 },{ _id : false });
}

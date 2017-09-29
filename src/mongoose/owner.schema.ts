'use strict';

var mongoose = require('mongoose');

export function OwnerSchemaFactory(){
	return new mongoose.Schema({
	 organizationCode: String,
	 userId: String // email
 },{ _id : false });
}

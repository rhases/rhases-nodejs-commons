'use strict';

var mongoose = require('mongoose');

export default function OwnerSchemaFactory(){
	return new mongoose.Schema({
	 organizationId: String,
	 userId: String // email
 });
}

'use strict';
const _ = require("lodash");

function overwriteIfArray(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return srcValue;
  }
}

export function mergeOverwriteIfArray(object, src) {
    return _.mergeWith(object, src, overwriteIfArray);
}
    
"use strict";
var pino = require('pino');
const l = pino({
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = l;
//# sourceMappingURL=logger.js.map
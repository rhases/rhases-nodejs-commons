var pino = require('pino');

const l = pino({
  name: process.env.APP_ID || 'unknown app',
  level: process.env.LOG_LEVEL || 'trace'
});

export default l;

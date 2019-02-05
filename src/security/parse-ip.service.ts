const ip6addr = require("ip6addr");

var createError = require('http-errors');
import l from '../logger';

export function parseIp(req, res, next) {
    try {
        const ip = (req.headers['x-forwarded-for'] || '').split(',').pop() ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        const addr = ip6addr.parse(ip);

        if (addr.kind() === 'ipv4') {
            req.parsedIp = addr.toString({ format: 'v4' });
        } else {
            req.parsedIp = addr.toString({ format: 'auto' });
        }
        next();
    } catch(err){
        l.error(err);
        next(createError(500, err));
    }
}

"use strict";
const logger_1 = require('../logger');
class ControllerUtils {
    constructor(service) {
        this.service = service;
    }
    find(req, res, queryExecutor) {
        var sortBy = req.query.sort;
        var currentPage = req.query.page || 1;
        var perPage = req.query.per_page || 200;
        queryExecutor
            .execCount()
            .then(function (totalCount) {
            res.set('X-Total-Count', String(totalCount));
            return queryExecutor.execFind(sortBy, currentPage, perPage);
        })
            .then(this.respondWithResult(res))
            .catch(this.handleError(res));
    }
    all(req, res) {
        this.service
            .all()
            .then(this.respondWithResult(res))
            .catch(this.handleError(res));
    }
    byId(req, res) {
        this.service
            .byId(req.params.id)
            .then(this.handleEntityNotFound(res))
            .then(this.respondWithResult(res))
            .catch(this.handleError(res));
    }
    create(req, res) {
        this.service
            .create(req.body)
            .then(this.respondWithResult(res, 201))
            .catch(this.handleError(res));
    }
    update(req, res) {
        this.service
            .update(req.params.id, req.body)
            .then(this.handleEntityNotFound(res))
            .then(this.respondWithResult(res))
            .catch(this.handleError(res));
    }
    remove(req, res) {
        this.service
            .remove(req.params.id)
            .then(this.handleEntityNotFound(res))
            .then(this.respondWithResult(res))
            .catch(this.handleError(res));
    }
    respondWithResult(res, statusCode) {
        statusCode = statusCode || 200;
        return function (entity) {
            if (entity) {
                res.status(statusCode).json(entity);
            }
        };
    }
    handleEntityNotFound(res) {
        return function (entity) {
            if (!entity) {
                res.status(404).end();
                return null;
            }
            return entity;
        };
    }
    handleError(res, statusCode) {
        statusCode = statusCode || 500;
        return function (err) {
            logger_1.default.error(err);
            if (err.name === 'ValidationError')
                statusCode = 400;
            res.status(statusCode).send(err);
        };
    }
}
exports.ControllerUtils = ControllerUtils;
//# sourceMappingURL=controller.utils.js.map
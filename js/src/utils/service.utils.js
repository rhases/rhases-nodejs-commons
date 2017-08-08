"use strict";
const logger_1 = require('../logger');
class ServiceUtils {
    constructor(model) {
        this.model = model;
    }
    all() {
        logger_1.default.info(`${this.model.collection.collectionName}.all()`);
        return this.model
            .find()
            .exec();
    }
    byId(id) {
        logger_1.default.info(`${this.model.collection.collectionName}.byId(${id})`);
        return this.model
            .findById(id)
            .exec();
    }
    create(data) {
        logger_1.default.info(data, `${this.model.collection.collectionName}.create(${data})`);
        return this.model.create(data);
    }
    update(id, data) {
        logger_1.default.info(data, `${this.model.collection.collectionName}.update(${data})`);
        if (data._id)
            delete data._id;
        return this.model
            .findById(id)
            .exec()
            .then(this.saveUpdates(data));
    }
    remove(id) {
        logger_1.default.info(id, `${this.model.collection.collectionName}.remove(${id})`);
        return this.model
            .findById(id)
            .exec()
            .then(this.removeEntity());
    }
    createQueryExecutor(queryBuilder) {
        var self = this;
        var executor = {};
        executor.execCount = function () {
            return self.execCount(queryBuilder);
        };
        executor.execFind = function (sortBy, currentPage, perPage) {
            return self.execFind(queryBuilder, sortBy, currentPage, perPage);
        };
        return executor;
    }
    execFind(queryBuilder, sortBy, currentPage, perPage) {
        logger_1.default.info(queryBuilder, `${this.model.collection.collectionName}.execFind()`);
        var query = queryBuilder(this.model.find());
        if (sortBy)
            query.sort(sortBy);
        if (currentPage > 0 && perPage > 0)
            query
                .skip((currentPage - 1) * perPage)
                .limit(perPage);
        return query.exec();
    }
    execCount(queryBuilder) {
        logger_1.default.info(queryBuilder, `${this.model.collection.collectionName}.execCount()`);
        return queryBuilder(this.model.count(null)).exec();
    }
    saveUpdates(updates) {
        return function (entity) {
            if (!entity)
                return;
            var updated = entity.merge(updates);
            return updated.save()
                .then((result) => {
                return result;
            });
        };
    }
    removeEntity() {
        return function (entity) {
            if (!entity)
                return;
            return entity.remove()
                .then((removed) => {
                return removed;
            });
        };
    }
}
exports.ServiceUtils = ServiceUtils;
//# sourceMappingURL=service.utils.js.map
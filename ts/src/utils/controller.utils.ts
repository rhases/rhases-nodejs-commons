import l from '../logger';
import { Request, Response } from 'express';

export class ControllerUtils {

  constructor(private service: any) {
  }

  find(req: Request, res: Response, queryExecutor: any) {
    var sortBy = req.query.sort;
    var currentPage = req.query.page || 1;
    var perPage = req.query.per_page || 200;

    queryExecutor
      .execCount()
      .then(function(totalCount:number) {
				res.set('X-Total-Count', String(totalCount));
			  return queryExecutor.execFind(sortBy, currentPage, perPage);
			})
      .then(this.respondWithResult(res))
      .catch(this.handleError(res));
  }

  all(req: Request, res: Response) {
    this.service
      .all()
      .then(this.respondWithResult(res))
      .catch(this.handleError(res));
  }

  byId(req: Request, res: Response) {
    this.service
      .byId(req.params.id)
      .then(this.handleEntityNotFound(res))
		  .then(this.respondWithResult(res))
      .catch(this.handleError(res));
  }

  create(req: Request, res: Response) {
    this.service
      .create(req.body)
      .then(this.respondWithResult(res, 201))
      .catch(this.handleError(res));
  }

  update(req: Request, res: Response) {
    this.service
      .update(req.params.id, req.body)
      .then(this.handleEntityNotFound(res))
		  .then(this.respondWithResult(res))
      .catch(this.handleError(res));
  }

  remove(req: Request, res: Response) {
    this.service
      .remove(req.params.id)
      .then(this.handleEntityNotFound(res))
		  .then(this.respondWithResult(res))
      .catch(this.handleError(res));
  }

  respondWithResult(res: Response, statusCode?:number) {
    statusCode = statusCode || 200;
    return function(entity: any) {
      if (entity) {
        res.status(statusCode).json(entity);
      }
    };
  }

  handleEntityNotFound(res: Response) {
    return function(entity: any) {
      if (!entity) {
        res.status(404).end();
        return null;
      }
      return entity;
    };
  }

  handleError(res:any, statusCode?:number) {
    statusCode = statusCode || 500;
    return function(err: any) {
      l.error(err);
      if(err.name === 'ValidationError')
        statusCode = 400;
      res.status(statusCode).send(err);
    };
  }
}

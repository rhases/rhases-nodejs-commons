import l from '../logger';
import { Request, Response } from 'express';
import { handleEntityNotFound, respondWithResult, handleError } from '../utils/controller.utils';

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
      .then(respondWithResult(res))
      .catch(handleError(res));
  }

}

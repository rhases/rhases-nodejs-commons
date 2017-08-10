//import l from '../logger';
import { Request, Response } from 'express';
import l from '../logger';

export function respondWithResult(res: Response, statusCode?:number) {
  statusCode = statusCode || 200;
  return function(entity: any) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}


export function handleEntityNotFound(res: Response) {
  return function(entity: any) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

export function handleError(res:any, statusCode?:number) {
  statusCode = statusCode || 500;
  return function(err: any) {
    l.error(err);
    if(err.name === 'ValidationError')
      statusCode = 400;
    res.status(statusCode).send(err);
  };
}

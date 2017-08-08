import { Request, Response } from 'express';
export declare class ControllerUtils {
    private service;
    constructor(service: any);
    find(req: Request, res: Response, queryExecutor: any): void;
    all(req: Request, res: Response): void;
    byId(req: Request, res: Response): void;
    create(req: Request, res: Response): void;
    update(req: Request, res: Response): void;
    remove(req: Request, res: Response): void;
    respondWithResult(res: Response, statusCode?: number): (entity: any) => void;
    handleEntityNotFound(res: Response): (entity: any) => any;
    handleError(res: any, statusCode?: number): (err: any) => void;
}

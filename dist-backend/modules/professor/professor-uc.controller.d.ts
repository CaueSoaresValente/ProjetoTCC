import { Request, Response } from 'express';
export declare class ProfessorUCController {
    private service;
    list(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    listByArea(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=professor-uc.controller.d.ts.map
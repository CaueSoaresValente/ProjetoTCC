import { Request, Response } from 'express';
export declare class ProfessorController {
    private service;
    findById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    findByCadastro(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=professor.controller.d.ts.map
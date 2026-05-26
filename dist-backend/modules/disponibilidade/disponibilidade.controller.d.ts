import { Request, Response } from 'express';
export declare class DisponibilidadeController {
    private service;
    findByProfessor(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    sincronizarSemana(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    adicionar(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    remover(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=disponibilidade.controller.d.ts.map
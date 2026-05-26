import { Request, Response } from 'express';
export declare class TurmaController {
    private service;
    listar(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    criar(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    atualizar(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    excluir(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    buscarProfessoresElegiveis(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    alocarProfessor(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    desalocarProfessor(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=turma.controller.d.ts.map
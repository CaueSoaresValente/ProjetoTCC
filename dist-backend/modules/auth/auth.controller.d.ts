import { Request, Response } from 'express';
export declare class AuthController {
    private authService;
    private cadastroRepo;
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    loginGoogle(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    recuperarSenha(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    redefinirSenha(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    checkSession(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=auth.controller.d.ts.map
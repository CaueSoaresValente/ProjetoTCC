import { Request, Response } from 'express';
export declare class AuthController {
    private authService;
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    recuperarSenha(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=auth.controller.d.ts.map
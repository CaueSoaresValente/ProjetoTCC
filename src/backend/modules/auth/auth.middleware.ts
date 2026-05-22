// src/backend/modules/auth/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";

const authService = new AuthService();

export const authMiddleware = (rolesPermitidos: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    // Extraímos o token com segurança
    const token = authHeader.split(" ")[1];

    // Proteção extra (evita qualquer possibilidade de undefined)
    if (!token) {
      return res.status(401).json({ message: "Token mal formatado" });
    }

    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }

    // Verifica RBAC (perfis permitidos)
    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(decoded.funcao)) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    // Coloca o usuário na requisição para uso nos controllers
    (req as any).usuario = decoded;

    next();
  };
};

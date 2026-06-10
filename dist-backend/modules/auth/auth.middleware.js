import { AuthService } from "./auth.service.js";
import { AppDataSource } from "../../config/data-source.js";
import { Cadastro } from "../cadastro/cadastro.entity.js";
const authService = new AuthService();
export const authMiddleware = (rolesPermitidos = []) => {
    return async (req, res, next) => {
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
        // Validação de segurança: verificar se o usuário ainda existe e está ativo no banco
        const cadastroRepo = AppDataSource.getRepository(Cadastro);
        const cadastro = await cadastroRepo.findOne({ where: { idUsuario: decoded.idUsuario } });
        if (!cadastro || !cadastro.status) {
            return res.status(401).json({ message: "Sessão inválida ou perfil excluído" });
        }
        // Verifica RBAC (perfis permitidos)
        if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(decoded.funcao)) {
            return res.status(403).json({ message: "Acesso negado" });
        }
        // Coloca o usuário na requisição para uso nos controllers
        req.usuario = decoded;
        next();
    };
};
//# sourceMappingURL=auth.middleware.js.map
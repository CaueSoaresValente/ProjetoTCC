// src/backend/tests/test-fetch.ts
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "meu_segredo_super_secreto_123";
async function testFetch() {
    try {
        console.log("🔄 Gerando token JWT...");
        const token = jwt.sign({
            idUsuario: 1,
            email: "gestor@gmail.com",
            funcao: "gestor",
            nome: "gestor",
        }, JWT_SECRET, { expiresIn: "1h" });
        console.log("✅ Token gerado!");
        console.log("🔄 Buscando perfis de professores...");
        const perfisRes = await fetch("http://localhost:3001/api/professores/perfis", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!perfisRes.ok) {
            const errText = await perfisRes.text();
            throw new Error(`Erro ao buscar perfis: ${perfisRes.status} - ${errText}`);
        }
        const perfis = await perfisRes.json();
        console.log("📊 Retorno da API:");
        console.log(JSON.stringify(perfis, null, 2));
    }
    catch (error) {
        console.error("❌ ERRO:", error.message);
    }
}
testFetch();
//# sourceMappingURL=test-fetch.js.map
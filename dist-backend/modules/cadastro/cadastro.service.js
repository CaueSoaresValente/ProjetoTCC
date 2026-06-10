import { CadastroRepository } from './cadastro.repository.js';
import { Cadastro } from './cadastro.entity.js';
import { AppDataSource } from '../../config/data-source.js';
import { OPP } from '../opp/opp.entity.js';
import { OPPArea } from '../area/opp-area.entity.js';
import { Gestor } from '../gestor/gestor.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { Turma } from '../turma/turma.entity.js';
import { WebSocketManager } from '../../shared/websocket.manager.js';
import { ProfessorArea } from '../area/professor-area.entity.js';
import { ProfessorUC } from '../disciplina/professor-uc.entity.js';
export class CadastroService {
    repo = new CadastroRepository();
    async create(data) {
        // Verifica se já existe um cadastro ativo com o mesmo email
        const todos = await this.repo.listAll();
        const duplicado = todos.find((u) => u.email === data.email);
        if (duplicado) {
            throw new Error("Já existe um cadastro com este e-mail.");
        }
        // Separa as áreas e UCs do payload antes de criar o cadastro
        const areas = data.areas || [];
        const ucs = data.ucs || [];
        delete data.areas;
        delete data.areaIds;
        delete data.ucs;
        delete data.ucIds;
        if (data.senha) {
            data.senha = await this.repo.hashPassword(data.senha);
        }
        const cadastro = await this.repo.create(data);
        if (cadastro) {
            // Cria o registro na tabela específica da função
            if (data.funcao === 'opp') {
                await this.criarOppComAreas(cadastro.idUsuario, areas);
            }
            else if (data.funcao === 'gestor') {
                await this.garantirGestor(cadastro.idUsuario);
            }
            else if (data.funcao === 'professor') {
                await this.garantirProfessor(cadastro.idUsuario);
                await this.atualizarAreasProfessor(cadastro.idUsuario, areas, ucs);
            }
        }
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'cadastros' });
        return cadastro;
    }
    async findById(id) {
        return await this.repo.findById(id);
    }
    async listAll() {
        const cadastros = await this.repo.listAll();
        const oppRepo = AppDataSource.getRepository(OPP);
        const profRepo = AppDataSource.getRepository(Professor);
        const resultado = [];
        for (const cadastro of cadastros) {
            if (cadastro.funcao === 'opp') {
                // Busca o OPP deste cadastro com suas áreas
                const opp = await oppRepo.findOne({
                    where: { idCadastro: cadastro.idUsuario },
                    relations: ['oppAreas', 'oppAreas.area'],
                });
                // Filtrar apenas áreas ativas
                const oppAreasAtivas = opp?.oppAreas?.filter((oa) => oa.area && oa.area.status) || [];
                const nomesDasAreas = oppAreasAtivas.map((oa) => oa.area.nome).filter(Boolean);
                const idsDasAreas = oppAreasAtivas.map((oa) => oa.idArea);
                resultado.push({
                    ...cadastro,
                    areas: nomesDasAreas,
                    areaIds: idsDasAreas,
                    ucs: [],
                    ucIds: [],
                });
            }
            else if (cadastro.funcao === 'professor') {
                // Busca o Professor deste cadastro com suas áreas e UCs
                const prof = await profRepo.findOne({
                    where: { idCadastro: cadastro.idUsuario },
                    relations: [
                        'professorAreas',
                        'professorAreas.area',
                        'professorUCs',
                        'professorUCs.unidadeCurricular',
                    ],
                });
                // Filtrar apenas áreas ativas
                const profAreasAtivas = prof?.professorAreas?.filter((pa) => pa.area && pa.area.status) || [];
                const nomesDasAreas = profAreasAtivas.map((pa) => pa.area.nome).filter(Boolean);
                const idsDasAreas = profAreasAtivas.map((pa) => pa.area.idArea);
                // Filtrar apenas UCs ativas
                const profUCsAtivas = prof?.professorUCs?.filter((puc) => puc.unidadeCurricular && puc.unidadeCurricular.status) || [];
                const nomesDasUCs = profUCsAtivas.map((puc) => puc.unidadeCurricular.nome).filter(Boolean);
                const idsDasUCs = profUCsAtivas.map((puc) => puc.idUC);
                resultado.push({
                    ...cadastro,
                    areas: nomesDasAreas,
                    areaIds: idsDasAreas,
                    ucs: nomesDasUCs,
                    ucIds: idsDasUCs,
                });
            }
            else {
                resultado.push({ ...cadastro, areas: [], areaIds: [], ucs: [], ucIds: [] });
            }
        }
        return resultado;
    }
    async update(id, data) {
        // Separa as áreas do payload
        const areas = data.areas || [];
        const ucs = data.ucs || [];
        delete data.areas;
        delete data.areaIds;
        delete data.ucs;
        delete data.ucIds;
        // CORREÇÃO: Se a senha foi enviada, precisamos fazer o hash antes de salvar.
        // Caso contrário, a senha seria salva em texto puro, quebrando o login.
        if (data.senha) {
            data.senha = await this.repo.hashPassword(data.senha);
        }
        const result = await this.repo.update(id, data);
        // Se for OPP, atualiza as áreas vinculadas
        if (data.funcao === 'opp') {
            await this.atualizarAreasOpp(id, areas);
        }
        else if (data.funcao === 'professor') {
            await this.atualizarAreasProfessor(id, areas, ucs);
        }
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'cadastros' });
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'areas' });
        return result;
    }
    async delete(id) {
        const cadastro = await this.repo.findById(id);
        if (!cadastro)
            return;
        if (cadastro.funcao === 'professor') {
            const profRepo = AppDataSource.getRepository(Professor);
            const professor = await profRepo.findOne({ where: { idCadastro: id } });
            if (professor) {
                // 1. Soft-delete o registro de Professor
                await profRepo.update(professor.idProfessor, { status: false });
                // 2. Limpar todas as alocações em turmas
                await AppDataSource.getRepository('professor_turma').delete({ idProfessor: professor.idProfessor });
                // 3. Limpar competências, áreas, disponibilidades e certificações
                await AppDataSource.getRepository('professor_uc').delete({ idProfessor: professor.idProfessor });
                await AppDataSource.getRepository('professor_area').delete({ idProfessor: professor.idProfessor });
                await AppDataSource.getRepository('disponibilidade').delete({ idProfessor: professor.idProfessor });
                await AppDataSource.getRepository('certificacao').delete({ idProfessor: professor.idProfessor });
            }
        }
        else if (cadastro.funcao === 'opp') {
            const oppRepo = AppDataSource.getRepository(OPP);
            const opp = await oppRepo.findOne({ where: { idCadastro: id } });
            if (opp) {
                // 1. Soft-delete o registro de OPP
                await oppRepo.update(opp.idOPP, { status: false });
                // 2. Deixar as turmas deste OPP sem OPP (setar idOPP para null)
                const turmaRepo = AppDataSource.getRepository(Turma);
                await turmaRepo.update({ idOPP: opp.idOPP }, { idOPP: null });
                // 3. Limpar vínculos de área do OPP
                await AppDataSource.getRepository('opp_area').delete({ idOPP: opp.idOPP });
            }
        }
        // Por fim, realiza o soft-delete do cadastro
        const result = await this.repo.delete(id);
        // Notifica em tempo real a exclusão do perfil para o usuário e encerra a sessão
        WebSocketManager.notifyUserSessionExpired(id);
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'cadastros' });
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
        return result;
    }
    // ====================== MÉTODOS AUXILIARES ======================
    async garantirGestor(idCadastro) {
        const gestorRepo = AppDataSource.getRepository(Gestor);
        const existe = await gestorRepo.findOne({ where: { idCadastro } });
        if (!existe) {
            const novo = gestorRepo.create({ idCadastro, status: true });
            await gestorRepo.save(novo);
            console.log(`✅ Registro de Gestor criado para cadastro=${idCadastro}`);
        }
    }
    async garantirProfessor(idCadastro) {
        const profRepo = AppDataSource.getRepository(Professor);
        const existe = await profRepo.findOne({ where: { idCadastro } });
        if (!existe) {
            const novo = profRepo.create({ idCadastro, status: true });
            await profRepo.save(novo);
            console.log(`✅ Registro de Professor criado para cadastro=${idCadastro}`);
        }
    }
    async criarOppComAreas(idCadastro, areas) {
        const oppRepo = AppDataSource.getRepository(OPP);
        const gestorRepo = AppDataSource.getRepository(Gestor);
        // Busca o primeiro gestor ativo para vincular ao OPP
        let gestor = await gestorRepo.findOne({ where: { status: true } });
        // Se não houver gestor na tabela gestor, tenta achar um cadastro gestor e criar o registro
        if (!gestor) {
            const cadGestor = await AppDataSource.getRepository(Cadastro).findOne({ where: { funcao: 'gestor', status: true } });
            if (cadGestor) {
                gestor = gestorRepo.create({ idCadastro: cadGestor.idUsuario, status: true });
                gestor = await gestorRepo.save(gestor);
                console.log(`✅ Gestor padrão criado a partir do cadastro=${cadGestor.idUsuario}`);
            }
        }
        if (!gestor) {
            console.log('⚠️ Nenhum gestor encontrado para vincular ao OPP. O registro OPP não será criado.');
            return;
        }
        // Cria o registro OPP
        const opp = oppRepo.create({
            idCadastro: idCadastro,
            idGestor: gestor.idGestor,
            status: true,
        });
        const oppSalvo = await oppRepo.save(opp);
        console.log(`✅ OPP criado com id=${oppSalvo.idOPP} para cadastro=${idCadastro}`);
        // Vincula as áreas selecionadas
        if (areas.length > 0) {
            const oppAreaRepo = AppDataSource.getRepository(OPPArea);
            const registros = areas.map((idArea) => oppAreaRepo.create({
                idOPP: oppSalvo.idOPP,
                idArea: idArea,
            }));
            await oppAreaRepo.save(registros);
            console.log(`✅ ${areas.length} área(s) vinculada(s) ao OPP id=${oppSalvo.idOPP}`);
        }
    }
    async atualizarAreasOpp(idCadastro, areas) {
        const oppRepo = AppDataSource.getRepository(OPP);
        const oppAreaRepo = AppDataSource.getRepository(OPPArea);
        // Busca o OPP pelo id_cadastro
        let opp = await oppRepo.findOne({ where: { idCadastro } });
        // Se não existir o registro OPP (cadastros antigos), tenta criar agora
        if (!opp) {
            await this.criarOppComAreas(idCadastro, areas);
            return;
        }
        // Remove todas as áreas antigas
        await oppAreaRepo.delete({ idOPP: opp.idOPP });
        // Insere as novas áreas
        if (areas.length > 0) {
            const registros = areas.map((idArea) => oppAreaRepo.create({
                idOPP: opp.idOPP,
                idArea: idArea,
            }));
            await oppAreaRepo.save(registros);
            console.log(`✅ Áreas atualizadas para OPP id=${opp.idOPP}: ${areas.join(', ')}`);
        }
    }
    async atualizarAreasProfessor(idCadastro, areas, ucs) {
        const profRepo = AppDataSource.getRepository(Professor);
        const profAreaRepo = AppDataSource.getRepository(ProfessorArea);
        const profUCRepo = AppDataSource.getRepository(ProfessorUC);
        // Busca o professor pelo id_cadastro
        let prof = await profRepo.findOne({ where: { idCadastro } });
        if (!prof) {
            // Se não existir, garante que exista
            await this.garantirProfessor(idCadastro);
            prof = await profRepo.findOne({ where: { idCadastro } });
        }
        // 1. Atualiza as áreas do professor
        await profAreaRepo.delete({ idProfessor: prof.idProfessor });
        if (areas.length > 0) {
            const registrosAreas = areas.map((idArea) => profAreaRepo.create({
                idProfessor: prof.idProfessor,
                idArea: idArea,
            }));
            await profAreaRepo.save(registrosAreas);
            console.log(`✅ Áreas atualizadas para Professor id=${prof.idProfessor}: ${areas.join(', ')}`);
        }
        // 2. Atualiza as UCs/Competências do professor
        await profUCRepo.delete({ idProfessor: prof.idProfessor });
        if (ucs.length > 0) {
            const registrosUCs = ucs.map((idUC) => profUCRepo.create({
                idProfessor: prof.idProfessor,
                idUC: idUC,
                nivelCompetencia: 100.00, // default para cadastrado pelo gestor
                status: true,
            }));
            await profUCRepo.save(registrosUCs);
            console.log(`✅ UCs atualizadas para Professor id=${prof.idProfessor}: ${ucs.join(', ')}`);
        }
    }
}
//# sourceMappingURL=cadastro.service.js.map
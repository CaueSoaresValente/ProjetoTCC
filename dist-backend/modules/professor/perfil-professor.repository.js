// ============================================================
// src/backend/modules/professor/perfil-professor.repository.ts
// ============================================================
// REPOSITORY para a tela de "Perfil dos Professores".
// Aqui ficam as queries que buscam os dados do professor
// com todas as relações necessárias (áreas, UCs, certificações,
// disponibilidade e turmas).
//
// COMO FUNCIONA:
//   1. O Controller recebe a requisição HTTP
//   2. O Controller chama o Service
//   3. O Service chama ESTE Repository
//   4. Este Repository usa o TypeORM para falar com o banco PostgreSQL
// ============================================================
import { AppDataSource } from '../../config/data-source.js';
import { Professor } from './professor.entity.js';
import { OPPArea } from '../area/opp-area.entity.js';
import { ProfessorArea } from '../area/professor-area.entity.js';
import { In } from 'typeorm';
export class PerfilProfessorRepository {
    // Repositórios do TypeORM
    professorRepo = AppDataSource.getRepository(Professor);
    oppAreaRepo = AppDataSource.getRepository(OPPArea);
    profAreaRepo = AppDataSource.getRepository(ProfessorArea);
    // ====================== LISTAR TODOS OS PROFESSORES ======================
    // Retorna todos os professores com os dados básicos:
    // - Dados do cadastro (nome, email)
    // - Áreas de atuação
    // - Turmas vinculadas (para calcular ocupação)
    // - Disponibilidade (para calcular ocupação)
    async findAll() {
        return await this.professorRepo.find({
            where: {
                status: true,
                cadastro: {
                    funcao: 'professor',
                    status: true
                }
            },
            relations: [
                'cadastro', // nome, email
                'professorAreas', // vínculos com áreas
                'professorAreas.area', // dados da área (nome)
                'professorTurmas', // turmas vinculadas
                'professorTurmas.turma', // dados da turma
                'professorTurmas.turma.turmaUCs', // UCs da turma (para calcular ocupação)
                'disponibilidades', // disponibilidade semanal
            ],
            order: { idProfessor: 'ASC' },
        });
    }
    // ====================== LISTAR PROFESSORES POR ÁREAS ======================
    // Quando o OPP acessa a tela, precisamos filtrar os professores
    // que atuam nas áreas de responsabilidade daquele OPP.
    //
    // Passo 1: Buscamos quais áreas o OPP é responsável (tabela opp_area)
    // Passo 2: Buscamos quais professores atuam nessas áreas (tabela professor_area)
    // Passo 3: Buscamos os dados completos desses professores
    async findByOPPAreas(idOPP) {
        // Passo 1: Busca as áreas do OPP
        const oppAreas = await this.oppAreaRepo.find({
            where: { idOPP },
        });
        // Se o OPP não tem áreas, retorna vazio
        if (oppAreas.length === 0) {
            return [];
        }
        // Pega só os IDs das áreas
        const idsAreas = oppAreas.map(oa => oa.idArea);
        // Passo 2: Busca quais professores atuam nessas áreas
        const profAreas = await this.profAreaRepo.find({
            where: { idArea: In(idsAreas) },
        });
        // Se nenhum professor atua nessas áreas, retorna vazio
        if (profAreas.length === 0) {
            return [];
        }
        // Pega os IDs dos professores (sem repetir)
        const idsProfessores = [...new Set(profAreas.map(pa => pa.idProfessor))];
        // Passo 3: Busca os professores com todas as relações
        return await this.professorRepo.find({
            where: {
                idProfessor: In(idsProfessores),
                status: true,
                cadastro: {
                    funcao: 'professor',
                    status: true
                }
            },
            relations: [
                'cadastro',
                'professorAreas',
                'professorAreas.area',
                'professorTurmas',
                'professorTurmas.turma',
                'professorTurmas.turma.turmaUCs',
                'disponibilidades',
            ],
            order: { idProfessor: 'ASC' },
        });
    }
    // ====================== BUSCAR PERFIL COMPLETO ======================
    // Retorna TODOS os dados de um professor específico.
    // Isso é chamado quando o Gestor/OPP clica no card do professor.
    async findFullProfile(idProfessor) {
        return await this.professorRepo.findOne({
            where: { idProfessor },
            relations: [
                'cadastro', // nome, email
                'professorAreas', // áreas
                'professorAreas.area', // dados da área
                'professorUCs', // UCs
                'professorUCs.unidadeCurricular', // dados da UC
                'professorUCs.unidadeCurricular.area', // área da UC
                'certificacoes', // certificações
                'disponibilidades', // disponibilidade
                'professorTurmas', // turmas
                'professorTurmas.turma', // dados da turma
                'professorTurmas.turma.turmaUCs', // UCs da turma (calendário)
                'professorTurmas.turma.turmaUCs.unidadeCurricular', // nome da UC
            ],
        });
    }
    // ====================== BUSCAR ÁREAS DO OPP ======================
    // Busca quais áreas o OPP é responsável.
    // Usado para filtrar os professores na listagem.
    async findOPPAreas(idOPP) {
        return await this.oppAreaRepo.find({
            where: { idOPP },
            relations: ['area'],
        });
    }
}
//# sourceMappingURL=perfil-professor.repository.js.map
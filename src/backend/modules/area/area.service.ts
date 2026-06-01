// ============================================================
// src/backend/modules/area/area.service.ts
// ============================================================
// SERVICE = a camada de "regras de negócio".
// Fica entre o Controller (que recebe a requisição HTTP)
// e o Repository (que fala com o banco).
//
// Por enquanto as regras são simples, mas é aqui que colocamos
// validações como "o nome não pode ser vazio" ou "não pode
// criar área com nome duplicado".
// ============================================================

import { AreaRepository } from './area.repository.js';
import { Area } from './area.entity.js';
import { AppDataSource } from '../../config/data-source.js';
import { OPP } from '../opp/opp.entity.js';
import { OPPArea } from './opp-area.entity.js';

export class AreaService {
  // Instancia o repository para usar os métodos de banco
  private repo = new AreaRepository();

  // Lista todas as áreas (filtra automaticamente por OPP se aplicável)
  async findAll(usuario?: any) {
    if (usuario && usuario.funcao === 'opp') {
      const oppRepo = AppDataSource.getRepository(OPP);
      const opp = await oppRepo.findOne({ where: { idCadastro: usuario.idUsuario, status: true } });
      if (!opp) {
        return [];
      }

      const oppAreaRepo = AppDataSource.getRepository(OPPArea);
      const oppAreas = await oppAreaRepo.find({
        where: { idOPP: opp.idOPP },
        relations: ['area', 'area.unidadesCurriculares'],
      });

      const areas = oppAreas.map(oa => oa.area).filter(Boolean) as Area[];
      // Filtra as UCs de cada área para manter apenas ativas
      for (const area of areas) {
        if (area.unidadesCurriculares) {
          area.unidadesCurriculares = area.unidadesCurriculares.filter(uc => uc.status);
        }
      }
      return areas;
    }
    return await this.repo.findAll();
  }

  // Busca uma área por ID
  async findById(id: number) {
    return await this.repo.findById(id);
  }

  // Cria uma nova área (com validação simples e de duplicidade)
  async create(data: Partial<Area>) {
    // Validação: o nome é obrigatório
    if (!data.nome || data.nome.trim() === '') {
      throw new Error('O nome da área é obrigatório');
    }

    const nomeFormatado = data.nome.trim();

    // 1. Verificação prévia case-insensitive de área ativa
    const existente = await this.repo.findByName(nomeFormatado);
    if (existente) {
      throw new Error('Já existe uma área cadastrada com este nome');
    }

    // 2. Proteção try-catch contra violação de chave única no banco
    try {
      return await this.repo.create({ ...data, nome: nomeFormatado });
    } catch (error: any) {
      if (
        error.code === '23505' ||
        error.message?.toLowerCase().includes('duplicate key') ||
        error.message?.toLowerCase().includes('unique constraint')
      ) {
        throw new Error('Já existe uma área cadastrada com este nome');
      }
      throw error;
    }
  }

  // Atualiza uma área existente
  async update(id: number, data: Partial<Area>) {
    // Validação: o nome é obrigatório
    if (data.nome !== undefined && data.nome.trim() === '') {
      throw new Error('O nome da área não pode ser vazio');
    }

    if (data.nome !== undefined) {
      const nomeFormatado = data.nome.trim();

      // 1. Verificação prévia case-insensitive
      const existente = await this.repo.findByName(nomeFormatado);
      if (existente && existente.idArea !== id) {
        throw new Error('Já existe uma área cadastrada com este nome');
      }

      data.nome = nomeFormatado;
    }

    // 2. Proteção try-catch contra violação de chave única no banco
    try {
      return await this.repo.update(id, data);
    } catch (error: any) {
      if (
        error.code === '23505' ||
        error.message?.toLowerCase().includes('duplicate key') ||
        error.message?.toLowerCase().includes('unique constraint')
      ) {
        throw new Error('Já existe uma área cadastrada com este nome');
      }
      throw error;
    }
  }

  // Exclui uma área
  async delete(id: number) {
    return await this.repo.delete(id);
  }
}

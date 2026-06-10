import { CadastroRepository } from './cadastro.repository.js';
import { Cadastro } from './cadastro.entity.js';
import { AppDataSource } from '../../config/data-source.js';
import { OPP } from '../opp/opp.entity.js';
import { OPPArea } from '../area/opp-area.entity.js';
import { Gestor } from '../gestor/gestor.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { Turma } from '../turma/turma.entity.js';
import { WebSocketManager } from '../../shared/websocket.manager.js';

export class CadastroService {
  private repo = new CadastroRepository();

  async create(data: any) {
    // Verifica se já existe um cadastro ativo com o mesmo email
    const todos = await this.repo.listAll();
    const duplicado = todos.find(
      (u) => u.email === data.email
    );
    if (duplicado) {
      throw new Error("Já existe um cadastro com este e-mail.");
    }

    // Separa as áreas do payload antes de criar o cadastro
    const areas: number[] = data.areas || [];
    delete data.areas;

    if (data.senha) {
      data.senha = await this.repo.hashPassword(data.senha);
    }
    const cadastro = await this.repo.create(data);

    if (cadastro) {
      // Cria o registro na tabela específica da função
      if (data.funcao === 'opp') {
        await this.criarOppComAreas(cadastro.idUsuario, areas);
      } else if (data.funcao === 'gestor') {
        await this.garantirGestor(cadastro.idUsuario);
      } else if (data.funcao === 'professor') {
        await this.garantirProfessor(cadastro.idUsuario);
      }
    }

    return cadastro;
  }

  async findById(id: number) {
    return await this.repo.findById(id);
  }

  async listAll() {
    const cadastros = await this.repo.listAll();

    // Para cada cadastro OPP, busca as áreas vinculadas
    const oppRepo = AppDataSource.getRepository(OPP);
    const resultado = [];

    for (const cadastro of cadastros) {
      if (cadastro.funcao === 'opp') {
        // Busca o OPP deste cadastro com suas áreas
        const opp = await oppRepo.findOne({
          where: { idCadastro: cadastro.idUsuario },
          relations: ['oppAreas', 'oppAreas.area'],
        });

        const nomesDasAreas = opp?.oppAreas
          ?.map((oa) => oa.area?.nome)
          .filter(Boolean) || [];

        resultado.push({
          ...cadastro,
          areas: nomesDasAreas,
        });
      } else {
        resultado.push({ ...cadastro, areas: [] });
      }
    }

    return resultado;
  }

  async update(id: number, data: any) {
    // Separa as áreas do payload
    const areas: number[] = data.areas || [];
    delete data.areas;

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

    return result;
  }

  async delete(id: number) {
    const cadastro = await this.repo.findById(id);
    if (!cadastro) return;

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
    } else if (cadastro.funcao === 'opp') {
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

    return result;
  }

  // ====================== MÉTODOS AUXILIARES ======================

  private async garantirGestor(idCadastro: number) {
    const gestorRepo = AppDataSource.getRepository(Gestor);
    const existe = await gestorRepo.findOne({ where: { idCadastro } });
    if (!existe) {
      const novo = gestorRepo.create({ idCadastro, status: true });
      await gestorRepo.save(novo);
      console.log(`✅ Registro de Gestor criado para cadastro=${idCadastro}`);
    }
  }

  private async garantirProfessor(idCadastro: number) {
    const profRepo = AppDataSource.getRepository(Professor);
    const existe = await profRepo.findOne({ where: { idCadastro } });
    if (!existe) {
      const novo = profRepo.create({ idCadastro, status: true });
      await profRepo.save(novo);
      console.log(`✅ Registro de Professor criado para cadastro=${idCadastro}`);
    }
  }

  private async criarOppComAreas(idCadastro: number, areas: number[]) {
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

  private async atualizarAreasOpp(idCadastro: number, areas: number[]) {
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
}

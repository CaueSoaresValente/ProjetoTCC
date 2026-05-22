
import { AppDataSource } from '../src/backend/config/data-source';
import { Area } from '../src/backend/modules/area/area.entity';
import { Professor } from '../src/backend/modules/professor/professor.entity';

async function check() {
  try {
    await AppDataSource.initialize();
    console.log('--- RELATÓRIO DE BANCO DE DADOS ---');
    
    const areaRepo = AppDataSource.getRepository(Area);
    const areas = await areaRepo.find();
    console.log(`Áreas cadastradas no sistema: ${areas.length}`);
    areas.forEach(a => console.log(` - [${a.idArea}] ${a.nome}`));

    const profRepo = AppDataSource.getRepository(Professor);
    const profs = await profRepo.find();
    console.log(`\nProfessores cadastrados: ${profs.length}`);
    profs.forEach(p => console.log(` - ID Prof: ${p.idProfessor}, ID Cadastro: ${p.idCadastro}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();

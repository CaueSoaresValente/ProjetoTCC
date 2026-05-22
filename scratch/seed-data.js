
import { AppDataSource } from '../src/backend/config/data-source.js';
import { Area } from '../src/backend/modules/area/area.entity.js';
import { UnidadeCurricular } from '../src/backend/modules/disciplina/unidade-curricular.entity.js';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Banco conectado!');

    const areaRepo = AppDataSource.getRepository(Area);
    const ucRepo = AppDataSource.getRepository(UnidadeCurricular);

    // 1. Criar Área de Tecnologia
    let areaTI = await areaRepo.findOne({ where: { nome: 'Tecnologia da Informação' } });
    if (!areaTI) {
      areaTI = await areaRepo.save({ nome: 'Tecnologia da Informação' });
      console.log('✅ Área TI criada!');
    }

    // 2. Criar Área de Gestão
    let areaGestao = await areaRepo.findOne({ where: { nome: 'Gestão e Negócios' } });
    if (!areaGestao) {
      areaGestao = await areaRepo.save({ nome: 'Gestão e Negócios' });
      console.log('✅ Área Gestão criada!');
    }

    // 3. Criar algumas UCs para TI
    const ucsTI = ['Lógica de Programação', 'Banco de Dados', 'Desenvolvimento Web'];
    for (const nome of ucsTI) {
      const existe = await ucRepo.findOne({ where: { nome, idArea: areaTI.idArea } });
      if (!existe) {
        await ucRepo.save({ nome, idArea: areaTI.idArea, cargaHoraria: 80 });
        console.log(`✅ UC ${nome} criada!`);
      }
    }

    console.log('\n🚀 Tudo pronto! Agora as áreas e UCs devem aparecer no seu perfil.');
    process.exit(0);
  } catch (error) {
    console.error('Erro no seed:', error);
    process.exit(1);
  }
}

seed();

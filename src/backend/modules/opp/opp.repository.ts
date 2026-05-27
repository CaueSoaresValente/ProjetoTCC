import { AppDataSource } from '../../config/data-source.js';
import { OPP } from './opp.entity.js';

export class OPPRepository {
  private repo = AppDataSource.getRepository(OPP);

  async findAll(): Promise<OPP[]> {
    return await this.repo.find({
      where: {
        status: true,
        cadastro: {
          status: true
        }
      },
      relations: ['cadastro', 'oppAreas', 'oppAreas.area']
    });
  }

  async findById(id: number): Promise<OPP | null> {
    return await this.repo.findOne({ where: { idOPP: id } });
  }
}

import { AppDataSource } from '../../config/data-source.js';
import { OPP } from './opp.entity.js';
export class OPPRepository {
    repo = AppDataSource.getRepository(OPP);
    async findAll() {
        return await this.repo.find({
            relations: ['cadastro', 'oppAreas']
        });
    }
    async findById(id) {
        return await this.repo.findOne({ where: { idOPP: id } });
    }
}
//# sourceMappingURL=opp.repository.js.map
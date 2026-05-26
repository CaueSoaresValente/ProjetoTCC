import { AppDataSource } from '../../config/data-source.js';
import { Gestor } from './gestor.entity.js';
export class GestorRepository {
    repo = AppDataSource.getRepository(Gestor);
    // Exemplo de findById
    async findById(id) {
        return await this.repo.findOne({ where: { idGestor: id } });
    }
}
//# sourceMappingURL=gestor.repository.js.map
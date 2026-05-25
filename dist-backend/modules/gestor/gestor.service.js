import { GestorRepository } from './gestor.repository.js';
export class GestorService {
    repo = new GestorRepository();
    async findById(id) {
        return await this.repo.findById(id);
    }
}
//# sourceMappingURL=gestor.service.js.map
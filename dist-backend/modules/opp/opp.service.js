import { OPPRepository } from './opp.repository.js';
export class OPPService {
    repo = new OPPRepository();
    async findAll() {
        return await this.repo.findAll();
    }
    async findById(id) {
        return await this.repo.findById(id);
    }
}
//# sourceMappingURL=opp.service.js.map
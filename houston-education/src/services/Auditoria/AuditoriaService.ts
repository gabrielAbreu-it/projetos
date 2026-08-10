import AuditoriaPrismaRepository from "../../repositories/Prisma/AuditoriaPrismaRepository.js";

class AuditoriaService {
  constructor(private _auditoriaRepository: AuditoriaPrismaRepository) {}

  async getAll() {
    const dadosAuditoria = await this._auditoriaRepository.getAll();
    return dadosAuditoria;
  }
}

export default AuditoriaService;

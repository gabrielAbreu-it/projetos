import { Request, Response } from "express";
import AuditoriaService from "../../services/Auditoria/AuditoriaService.js";
import AuditoriaPrismaRepository from "../../repositories/Prisma/AuditoriaPrismaRepository.js";

const auditoriaService = new AuditoriaService(new AuditoriaPrismaRepository());

class AuditoriaController {
  async getAll(req: Request, res: Response) {
    try {
      const dadosAuditoria = await auditoriaService.getAll();
      return res.status(200).json(dadosAuditoria);
    } catch (err: any) {
      return res.status(500).json({ erro: err.message });
    }
  }
}

export default AuditoriaController;

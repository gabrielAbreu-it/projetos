import { Request, Response } from "express";
import LocalService from "../../services/Local/LocalService.js";
import LocalPrismaRepository from "../../repositories/Prisma/LocalPrismaRepository.js";

const localService = new LocalService(new LocalPrismaRepository());

class LocalController {
  async getAll(_Req: Request, Res: Response) {
    try {
      const locais = await localService.getAll();
      return Res.status(200).json(locais);
    } catch (err: any) {
      return Res.status(500).json({ err: err.message });
    }
  }
  
  async getById(Req: Request, Res: Response) {
    try {
      const id = parseInt(Req.params.id, 10);
      const local = await localService.getById(id);
      return Res.status(200).json(local);
    } catch (err: any) {
      if (err.message === "LOCAL_INEXISTENTE") {
        return Res.status(404).json({ erro: "LOCAL_INEXISTENTE" });
      }
      return Res.status(500).json({ erro: err.message });
    }
  }
  async create(Req: Request, Res: Response) {
    try {
      const local = await localService.create(Req.body);
      return Res.status(201).json(local);
    } catch (err: any) {
      if (err.message === "LOCAL_DUPLICADO") {
        return Res.status(409).json({ erro: "LOCAL_DUPLICADO" });
      }
      if (err.message === "CAMPUS_INVALIDO") {
        return Res.status(400).json({ erro: "CAMPUS_INVALIDO" });
      }
      return Res.status(500).json({ erro: err.message });
    }
  }

  async update(Req: Request, Res: Response) {
    try {
      const id = parseInt(Req.params.id, 10);
      const dados = { ...Req.body };

      if (dados.campusId) {
        dados.campusId = parseInt(dados.campusId, 10);
      }

      const local = await localService.update(id, dados);
      
      return Res.status(200).json(local);
    } catch (err: any) {
      if (err.message === "LOCAL_INEXISTENTE") {
        return Res.status(404).json({ erro: "LOCAL_INEXISTENTE" });
      }
      if (err.message === "LOCAL_DUPLICADO") {
        return Res.status(409).json({ erro: "LOCAL_DUPLICADO" });
      }
      if (err.message === "CAMPUS_INVALIDO") {
        return Res.status(400).json({ erro: "CAMPUS_INVALIDO" });
      }
      if (err.message?.includes("Foreign key constraint") || err.message?.toLowerCase().startsWith("fk")) {
        return Res.status(400).json({ erro: "CAMPUS_INEXISTENTE" });
      }
      if (err.message?.includes("Unique constraint")) {
        return Res.status(409).json({ erro: "LOCAL_DUPLICADO" });
      }
      return Res.status(500).json({ erro: err.message });
    }
  }

  async delete(Req: Request, Res: Response) {
    try {
      const id = parseInt(Req.params.id, 10);
      await localService.delete(id);
      return Res.status(204).send();
    } catch (err: any) {
      if (err.message === "LOCAL_INEXISTENTE") {
        return Res.status(404).json({ erro: "LOCAL_INEXISTENTE" });
      }
      return Res.status(500).json({ erro: err.message });
    }
  }
}

export default new LocalController();

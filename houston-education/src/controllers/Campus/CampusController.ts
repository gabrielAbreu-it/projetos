import { Request, Response } from "express";
import CampusService from "../../services/Campus/CampusService.js";
import CampusPrismaRepository from "../../repositories/Prisma/CampusPrismaRepository.js";

const campusService = new CampusService(new CampusPrismaRepository());

class CampusController {
  async getAll(_Req: Request, Res: Response) {
    try {
      const campus = await campusService.getAll();
      return Res.status(200).json(campus);
    } catch (err: any) {
      return Res.status(500).json({ erro: err.message });
    }
  }
}

export default new CampusController();

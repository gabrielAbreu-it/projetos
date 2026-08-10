import CampusPrismaRepository from "../../repositories/Prisma/CampusPrismaRepository.js";
import { Campus } from "@prisma/client";

class CampusService {
  constructor(private _campusRepository: CampusPrismaRepository) {}

  async getAll(): Promise<Campus[]> {
    return await this._campusRepository.getAll();
  }
}

export default CampusService;

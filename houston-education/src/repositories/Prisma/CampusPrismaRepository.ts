import { prisma } from "./client.js";
import { Campus } from "@prisma/client";

class CampusPrismaRepository {
  async getAll(): Promise<Campus[]> {
    const campus = await prisma.campus.findMany();
    return campus;
  }
}

export default CampusPrismaRepository;

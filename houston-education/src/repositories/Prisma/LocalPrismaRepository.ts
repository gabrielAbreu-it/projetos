import { prisma } from "./client.js";
import { Local, Prisma } from "@prisma/client";

class LocalPrismaRepository {
  async getAll(): Promise<Local[]> {
    const locais = await prisma.local.findMany({
      include: { campus: { select: { nome: true } } }
    });
    return locais;
  }

  async findByNomeAndCampus(nome: string, campusId: number): Promise<Local | null> {
    const local = await prisma.local.findUnique({
      where: { nome_campusId: { nome, campusId } }
    });
    return local;
  }

  async create(data: Prisma.LocalUncheckedCreateInput): Promise<Local> {
    const novoLocal = await prisma.local.create({ data });
    return novoLocal;
  }

  async getById(id: number): Promise<Local | null> {
    const local = await prisma.local.findUnique({ where: { id } });
    return local;
  }

  async update(id: number, data: Prisma.LocalUncheckedUpdateInput): Promise<Local | null> {
    const localAtualizado = await prisma.local.update({ where: { id }, data });
    return localAtualizado;
  }

  async delete(id: number): Promise<Local> {
    const localApagado = await prisma.local.delete({ where: { id } });
    return localApagado;
  }
}

export default LocalPrismaRepository;

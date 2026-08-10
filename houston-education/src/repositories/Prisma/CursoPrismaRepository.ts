import { prisma } from "./client.js";
import { Curso } from "@prisma/client";

class CursoPrismaRepository {
  async getAll(): Promise<Curso[]> {
    const cursos = await prisma.curso.findMany();
    return cursos;
  }

  async create(data: { nome: string; descricao?: string }): Promise<Curso> {
    const curso = await prisma.curso.create({ data });
    return curso;
  }

  async update(id: number, data: { nome?: string; descricao?: string }): Promise<Curso> {
    const curso = await prisma.curso.update({
      where: { id },
      data
    });
    return curso;
  }

  async getById(id: number): Promise<Curso | null> {
    const curso = await prisma.curso.findUnique({
      where: { id }
    });
    return curso;
  }

  async delete(id: number): Promise<Curso> {
    const curso = await prisma.curso.delete({
      where: { id }
    });
    return curso;
  }
}

export default CursoPrismaRepository;

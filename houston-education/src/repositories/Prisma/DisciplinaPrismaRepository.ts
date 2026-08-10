import { prisma } from "../Prisma/client.js";
import { Disciplina } from "@prisma/client";

class DisciplinaPrismaRepository {
  async getAll(): Promise<(Disciplina & { cursos: { curso: { id: number; nome: string } }[] })[]> {
    const dadosDisciplina = await prisma.disciplina.findMany({
      include: {
        cursos: {
          include: {
            curso: {
              select: { id: true, nome: true }
            }
          }
        }
      }
    });
    return dadosDisciplina;
  }

  async getByCurso(cursoId: number): Promise<Disciplina[]> {
    const dadosDisciplina = await prisma.disciplina.findMany({
      where: {
        cursos: {
          some: { cursoId },
        },
      },
    });
    return dadosDisciplina;
  }

  async getById(id: number): Promise<Disciplina | null> {
    const DisciplinaDados = await prisma.disciplina.findFirst({
      where: {
        id: id,
      },
    });

    return DisciplinaDados;
  }

  async create(data: { nome: string; descricao?: string; cursoIds?: number[] }): Promise<Disciplina> {
    const { cursoIds, ...disciplinaData } = data;

    const novaDisciplina = await prisma.$transaction(async (tx) => {
      const disciplina = await tx.disciplina.create({
        data: disciplinaData,
      });

      if (cursoIds && cursoIds.length > 0) {
        await tx.disciplinaCurso.createMany({
          data: cursoIds.map((cursoId) => ({
            disciplinaId: disciplina.id,
            cursoId,
          })),
        });
      }

      return disciplina;
    });

    return novaDisciplina;
  }

  async update(id: number, data: { nome?: string; descricao?: string; cursoIds?: number[] }): Promise<Disciplina | null> {
    const { cursoIds, ...disciplinaData } = data;

    const disciplinaAtualizada = await prisma.$transaction(async (tx) => {
      const disciplina = await tx.disciplina.update({
        data: disciplinaData,
        where: { id },
      });

      if (cursoIds !== undefined) {
        await tx.disciplinaCurso.deleteMany({
          where: { disciplinaId: id },
        });

        if (cursoIds.length > 0) {
          await tx.disciplinaCurso.createMany({
            data: cursoIds.map((cursoId) => ({
              disciplinaId: id,
              cursoId,
            })),
          });
        }
      }

      return disciplina;
    });

    return disciplinaAtualizada;
  }

  async delete(id: number): Promise<Disciplina> {
    const DisciplinaApagada = await prisma.disciplina.delete({
      where: {
        id: id,
      },
    });

    return DisciplinaApagada;
  }
}

export default DisciplinaPrismaRepository;

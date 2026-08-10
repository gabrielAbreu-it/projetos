import { PrismaClient } from "@prisma/client";
import { Inscricao } from "@prisma/client";

const prisma = new PrismaClient();

class InscricaoPrismaRepository {
  async getAll(): Promise<Inscricao[]> {
    const Inscricoes = await prisma.inscricao.findMany();
    return Inscricoes;
  }

  async findAlunoMonitoria(
    alunoId: string,
    monitoriaId: string
  ): Promise<Inscricao | null> {
    const inscricao = await prisma.inscricao.findFirst({
      where: {
        alunoId,
        monitoriaId,
      },
    });

    return inscricao;
  }

  async getInscricaoAluno(alunoId: string): Promise<Inscricao[]> {
    const inscricao = await prisma.inscricao.findMany({
      where: {
        alunoId,
      },
    });

    return inscricao;
  }

  async getByMonitoria(monitoriaId: string): Promise<any[]> {
    const inscricoes = await prisma.inscricao.findMany({
      where: {
        monitoriaId,
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            matricula: true,
          },
        },
        monitoria: {
          select: {
            id: true,
            nome_monitoria: true,
          },
        },
      },
      orderBy: {
        aluno: {
          nome: "asc",
        },
      },
    });
    return inscricoes;
  }

  async getById(id: number): Promise<any | null> {
    const inscricaoId = await prisma.inscricao.findFirst({
      where: {
        id: id,
      },
      include: {
        monitoria: {
          select: {
            inicio: true,
            fim: true,
          },
        },
      },
    });

    return inscricaoId;
  }
  
  async getMinhasInscricoes(alunoId: string): Promise<any[]> {
    const inscricoes = await prisma.inscricao.findMany({
      where: {
        alunoId,
      },
      select: {
        id: true,
        presente: true,
        aluno: {
          select: {
            nome: true,
          },
        },
        monitoria: {
          select: {
            nome_monitoria: true,
            inicio: true,
            fim: true,
            descricao: true,
            disciplina: {
              select: {
                nome: true,
                cursos: {
                  select: {
                    curso: {
                      select: {
                        nome: true,
                      },
                    },
                  },
                },
              },
            },
            local: {
              select: {
                nome: true,
                campus: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
            monitor: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });
    return inscricoes;
  }
  
  async create(data: Inscricao): Promise<Inscricao> {
    const novaInscricao = await prisma.inscricao.create({
      data,
    });

    return novaInscricao;
  }
  async salvarChamada(atualizacoes: { id: number; presente: boolean }[]): Promise<Inscricao[]> {
    const resultados = await prisma.$transaction(
      atualizacoes.map((a) =>
        prisma.inscricao.update({
          where: { id: a.id },
          data: { presente: a.presente },
        })
      )
    );
    return resultados;
  }

  async delete(id: number): Promise<Inscricao> {
    const inscricaoApagado = await prisma.inscricao.delete({
      where: {
        id: id,
      },
    });
  
    return inscricaoApagado;
  }
}

export default InscricaoPrismaRepository;

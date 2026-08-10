import { prisma } from "../Prisma/client.js";
import { Monitoria, Prisma } from "@prisma/client";

class MonitoriaPrismaRepository {
  async getAll(): Promise<any[]> {
    const dadosMonitoria = await prisma.monitoria.findMany({
      include: {
        disciplina: {
          include: {
            cursos: {
              include: {
                curso: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
        monitor: {
          select: {
            nome: true,
          },
        },
        local: {
          select: {
            nome: true,
            campusId: true,
            campus: {
              select: {
                nome: true,
              },
            },
          },
        },
        _count: {
          select: {
            inscricoes: true,
          },
        },
      },
    });
    return dadosMonitoria;
  }

  async marcarExpiradas(): Promise<void> {
    await prisma.monitoria.updateMany({
      where: {
        expiredAt: null,
        fim: { lt: new Date() },
      },
      data: { expiredAt: new Date() },
    });
  } // criei essa function para marcar como expiradas as monitorias no cron job 

  async getDisponiveis(): Promise<any[]> {
    const dadosMonitoria = await prisma.monitoria.findMany({
      where: {
        fim: {
          gte: new Date(),
        },
        deletedAt : null,
      },
      include: {
        disciplina: {
          include: {
            cursos: {
              include: {
                curso: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
        monitor: {
          select: {
            nome: true,
          },
        },
        local: {
          select: {
            nome: true,
            campusId: true,
            campus: {
              select: {
                nome: true,
              },
            },
          },
        },
        _count: {
          select: {
            inscricoes: true,
          },
        },
      },
    });
    return dadosMonitoria;
  }

  async getByMonitor(monitorId: string): Promise<any[]> {
    const dadosMonitoria = await prisma.monitoria.findMany({
      where: {
        monitorId: monitorId,
      },
      include: {
        disciplina: {
          include: {
            cursos: {
              include: {
                curso: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
        monitor: {
          select: {
            nome: true,
          },
        },
        local: {
          select: {
            nome: true,
            campusId: true,
            campus: {
              select: {
                nome: true,
              },
            },
          },
        },
        _count: {
          select: {
            inscricoes: true,
          },
        },
      },
    });
    return dadosMonitoria;
  }

  async getHistoricoMonitor(monitorId: string): Promise<any[]> {
    const dadosMonitoria = await prisma.monitoria.findMany({
      where: {
        monitorId: monitorId,
      },
      include: {
        disciplina: {
          select: {
            nome: true,
          },
        },
        monitor: {
          select: {
            nome: true,
          },
        },
        inscricoes: {
          where: {
            presente: true,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            inscricoes: true,
          },
        },
      },
    });
    return dadosMonitoria;
  }

  async getHistoricoAdmin(): Promise<any[]> {
    const dadosMonitoria = await prisma.monitoria.findMany({
      include: {
        disciplina: {
          select: {
            nome: true,
          },
        },
        monitor: {
          select: {
            nome: true,
          },
        },
        inscricoes: {
          where: {
            presente: true,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            inscricoes: true,
          },
        },
      },
    });
    return dadosMonitoria;
  }

  async getById(id: string): Promise<any | null> {
    const monitoriaDados = await prisma.monitoria.findFirst({
      where: {
        id: id,
        deletedAt: null,
      },
      select: {
        id: true,
        nome_monitoria: true,
        descricao: true,
        inicio: true,
        fim: true,
        monitorId: true,
        disciplinaId: true,
        localId: true,
        ata: true,
        expiredAt: true
      }
    });

    return monitoriaDados;
  }

  async getChamadaMonitoria(monitoriaId: string): Promise<any[]> {
    const dadosChamada = await prisma.$queryRaw`
      SELECT
        aluno.nome,
        aluno.matricula,
        insc.presente
      FROM inscricao AS insc
      INNER JOIN aluno ON aluno.id = insc."alunoId"
      WHERE insc."monitoriaId" = ${monitoriaId}
    `;

    return dadosChamada as any[];
  }

  async conflitoHorario( localId: number,inicio: Date, fim: Date, monitoriaExistenteId?: string): Promise<boolean> { // lembrar In < Fa and Ia < Fn - se ambos true - HÁ CONFLITO
    const monitoria = await prisma.monitoria.findFirst({
      where: {
        expiredAt : null,
        id: monitoriaExistenteId ? {not : monitoriaExistenteId} : undefined, // estou basicamente dizendo o seguinte: caso o id de uma monitoria exsitente venha, busque um id diferente desse mesmo, e, caso não venha, eu boto como undefined. Eu preciso disso pq na função de update, caso eu não passe o id da própria monitoria que estou atualizando, eu sempre teria um true dessa função. 
        localId,
        fim: { gt: inicio }, 
        inicio: { lt: fim },
      },
    });
    
    return !!monitoria;
  }

  async create(data: Prisma.MonitoriaUncheckedCreateInput): Promise<Monitoria> {
    const novAMonitoria = await prisma.monitoria.create({
      data,
    });

    return novAMonitoria;
  }

  async update( id: string, data: Prisma.MonitoriaUncheckedUpdateInput ): Promise<Monitoria | null> {
    const monitoriaAtualizada = await prisma.monitoria.update({
      data,
      where: {
        id: id,
      },
    });

    return monitoriaAtualizada;
  }

  async delete(id: string): Promise<Monitoria> {
    const monitoriaApagada = await prisma.monitoria.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return monitoriaApagada;
  }
}


export default MonitoriaPrismaRepository;
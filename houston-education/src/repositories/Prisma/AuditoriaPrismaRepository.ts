import { prisma } from "./client.js";

interface DadosAuditoria {
  usuarioId: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhes: any;
}

class AuditoriaPrismaRepository {
  
  async getAll() {
    const res =  await prisma.auditoria.findMany({
      include: {
        usuario: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    })
    
    return res;
  }// retorna todos os registros da tabela com o nome do usuário

  
  async createAuditoria(payload: DadosAuditoria) {
    const auditoria = await prisma.auditoria.create({
      data: {
        usuarioId: payload.usuarioId,
        acao: payload.acao,
        entidade: payload.entidade,
        entidadeId: payload.entidadeId,
        detalhes: payload.detalhes,
      },
    });

    return auditoria;
  }// cria log de auditoria de criação de monitoria
}

export default AuditoriaPrismaRepository;

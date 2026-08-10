import { PrismaClient, Aluno } from "@prisma/client";

const prisma = new PrismaClient();

class AlunoPrismaRepository {
    async getAll(perfilNome?: string, skip?: number, take?: number): Promise<any[]> {
        const alunos = await prisma.aluno.findMany({
            where: {
                deletedAt: null,
                ...(perfilNome ? {
                    perfil: {
                        nome: perfilNome
                    }
                } : {})
            },
            select: {
                id: true,
                nome: true,
                email: true,
                matricula: true,
                perfilId: true,
                perfil: {
                    select: {
                        nome: true
                    }
                }
            },
            skip: skip || 0,
            take: take || 50
        });

        return alunos;
    }

    async findByEmailAndMatricula(email: string, matricula: string): Promise<any | null> {
        const aluno = await prisma.aluno.findFirst({
            where: {
                deletedAt: null,
                OR: [
                    { email: email },
                    { matricula: matricula }
                ]
            },
            select: {
                id: true,
                nome: true,
                email: true,
                matricula: true,
                senha: true,
                perfilId: true,
                perfil: {
                    select: {
                        nome: true
                    }
                }
            }
        });

        return aluno;
    }

    async getById(id: string): Promise<any | null> {
        const aluno = await prisma.aluno.findFirst({
            where: {
                id: id,
                deletedAt: null
            },
            select: {
                id: true,
                nome: true,
                email: true,
                matricula: true,
                perfilId: true,
                perfil: {
                    select: {
                        nome: true
                    }
                }
            }
        });

        return aluno;
    }
    async create(data : Aluno) : Promise <any>{

        const novoAluno = await prisma.aluno.create({
            data,
            select: {
                id: true,
                nome: true,
                email: true,
                matricula: true,
                perfilId: true,
                perfil: {
                    select: {
                        nome: true
                    }
                }
            }
        })

        return novoAluno;
    }


    async update(id : string, data : Aluno) : Promise <any | null>{
        const alunoAtualizado = await prisma.aluno.update({
            data,
            where : {
                id : id
            },
            select: {
                id: true,
                nome: true,
                email: true,
                matricula: true,
                perfilId: true,
                perfil: {
                    select: {
                        nome: true
                    }
                }
            }
        })

        return alunoAtualizado;

    }
    async updateUsuarioByAdmin(id: string, perfilId: number): Promise<any | null> {
        const alunoAtualizado = await prisma.aluno.update({
            data: { perfilId },
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                matricula: true,
                perfilId: true,
                perfil: {
                    select: {
                        nome: true
                    }
                }
            }
        });

        return alunoAtualizado;
    }

    async updateSenha(id: string, senha: string): Promise<any> {
        const alunoAtualizado = await prisma.aluno.update({
            data: { senha },
            where: { id },

            select : {
                id : true,
                nome : true,
                perfilId : true,
                perfil: {
                    select: {
                        nome: true
                    }
                }
            }
        });

        return alunoAtualizado;
    }
    async delete(id: string): Promise<any> {
        const alunoApagado = await prisma.aluno.update({
            where: { id },
            data: { deletedAt: new Date() },
            select: {
                id: true,
                nome: true,
                email: true,
                matricula: true,
                perfilId: true,
                perfil: {
                    select: {
                        nome: true
                    }
                }
            }
        });

        return alunoApagado;
    }


}

export default AlunoPrismaRepository;
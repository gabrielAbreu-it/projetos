import { Aluno } from "@prisma/client";
import type AlunoPrismaRepository from "../../repositories/Prisma/AlunoPrismaRepository.js";
import bcrypt from "bcrypt";
import { eventEmmiter } from "../../utils/events/Evento.js";
import { getPepper } from "../../utils/security/pepper.js";
import { allowedNodeEnvironmentFlags } from "process";


class AlunosService {

    // constructor(private _alunoRespository : AlunoRepository){}
    constructor(private _alunoPrismaRepository: AlunoPrismaRepository) { }

    async getAll(perfilNome?: string, skip?: number, take?: number): Promise<Aluno[]> {
        const alunosDados = await this._alunoPrismaRepository.getAll(perfilNome, skip, take)
        return alunosDados;
    }
    async getById(id: string): Promise<Aluno> {
        const alunoDados = await this._alunoPrismaRepository.getById(id)
        
        if (!alunoDados) {
            throw new Error("ALUNO_INEXISTENTE")
        }
        return alunoDados;
    }
    
    async create(dados : Aluno, adminId ? : string) : Promise < Aluno > {

        const matriculaString = String(dados.matricula)

        const alunoExistente = await this._alunoPrismaRepository.findByEmailAndMatricula(dados.email, matriculaString);

        if(alunoExistente) {
            if (alunoExistente.email === dados.email) {
                throw new Error("EMAIL_EXISTE")
            }
            if (alunoExistente.matricula === dados.matricula) {
                throw new Error("MATRICULA_EXISTE")
            }
        }

        const senhaHash = await bcrypt.hash(dados.senha, 10);

        const dadosComSenhaHash = {
            ...dados,
            senha: senhaHash
        };

        const dadosAlunos = await this._alunoPrismaRepository.create(dadosComSenhaHash)

        eventEmmiter.emit("Aluno:Criado", {
            usuarioId: adminId || dadosAlunos.id,
            acao: adminId ? "CRIAR_ALUNO_PELO_ADMIN" : "CRIAR_ALUNO",
            entidade: "Aluno",
            entidadeId: dadosAlunos.id,
            aluno: {
                nome: dadosAlunos.nome,
                email: dadosAlunos.email,
                matricula: dadosAlunos.matricula,
            },
        });

        return dadosAlunos;
    }
    async update(id: string, dados: Aluno): Promise<Aluno> {

        const alunoAntes = await this._alunoPrismaRepository.getById(id);

        if (!alunoAntes) {
            throw new Error("ALUNO_INEXISTENTE")
        }

        if (dados.nome !== undefined && dados.nome.trim() === "") {
            throw new Error("NOME_OBRIGATORIO")
        }

        if (dados.email !== undefined && dados.email.trim() === "") {
            throw new Error("EMAIL_OBRIGATORIO")
        }

        if (dados.matricula !== undefined && dados.matricula.length < 8) {
            throw new Error("MATRICULA_INVALIDA")
        }

        if (dados.matricula || dados.email) {
            const alunoExistente = await this._alunoPrismaRepository.findByEmailAndMatricula(dados.email || "", dados.matricula || "")

            if (alunoExistente && alunoExistente.id !== id) {
                throw new Error("MATRICULA_OU_EMAIL_EM_USO")
            }
        }

        const alunoDados = await this._alunoPrismaRepository.update(id, dados)

        if (!alunoDados) {
            throw new Error("ALUNO_INEXISTENTE")
        }

        // auditoria
        const camposParaComparar = ["nome", "email", "matricula"] as const;
        const alteracoes = [];

        for (const campo of camposParaComparar) {
            const valorAntes = alunoAntes[campo]; //houston, por exemplo. Se não vier uma alteração, viria: houston -> valor não alterado
            const valorDepois = alunoDados[campo]; // houston1, por exemplo. Se não vier uma alteração, viria: houston -> valor também não foi alterado mesmo após update

            if (valorAntes !== valorDepois) {
                alteracoes.push({
                    campo,
                    antes: valorAntes,
                    depois: valorDepois

                    //exemplo de como fica o log:  campo: nome, antes: houston, depois: houston1
                });
            }
        }

        if (alteracoes.length > 0) {
            eventEmmiter.emit("Aluno:Atualizado", {
                usuarioId: id,
                acao: "ATUALIZAÇÃO_PELO_USUÁRIO",
                entidade: "Aluno",
                entidadeId: id,
                detalhes: {
                    alteracoes
                }
            })
        }

        return alunoDados;
    }

    async updateUsuarioByAdmin(id: string, dados: any, usuarioId: string): Promise<Aluno> {
        const alunoAntes = await this._alunoPrismaRepository.getById(id);

        if (!alunoAntes) {
            throw new Error("ALUNO_INEXISTENTE");
        }

        const dadosAtualizados: any = {};

        if (dados.perfilId !== undefined) {
            dadosAtualizados.perfilId = dados.perfilId;
        }

        if (dados.nome !== undefined) {
            if (dados.nome.trim() === "") {
                throw new Error("NOME_OBRIGATORIO");
            }
            dadosAtualizados.nome = dados.nome;
        }

        if (dados.email !== undefined) {
            if (dados.email.trim() === "") {
                throw new Error("EMAIL_OBRIGATORIO");
            }
            dadosAtualizados.email = dados.email;
        }

        if (dados.matricula !== undefined) {
            if (dados.matricula.length < 8) {
                throw new Error("MATRICULA_INVALIDA");
            }
            dadosAtualizados.matricula = dados.matricula;
        }

        if (dados.senha !== undefined) {
            if (dados.senha.trim() === "") {
                throw new Error("SENHA_OBRIGATORIA");
            }

            const senhaHash = await bcrypt.hash(dados.senha, 10);
            dadosAtualizados.senha = senhaHash;
        }

        if (dadosAtualizados.email || dadosAtualizados.matricula) {
            const alunoDuplicado = await this._alunoPrismaRepository.findByEmailAndMatricula(dadosAtualizados.email || "", dadosAtualizados.matricula || "");

            if (alunoDuplicado && alunoDuplicado.id !== id) {
                if (alunoDuplicado.email === dadosAtualizados.email) {
                    throw new Error("EMAIL_EXISTE");
                }
                if (alunoDuplicado.matricula === dadosAtualizados.matricula) {
                    throw new Error("MATRICULA_EXISTE");
                }
                throw new Error("MATRICULA_OU_EMAIL_EM_USO");
            }
        }

        const alunoAtualizado = await this._alunoPrismaRepository.update(id, dadosAtualizados);

        if (!alunoAtualizado) {
            throw new Error("ERRO_AO_ATUALIZAR_PERFIL");
        }

        // auditoria
        const camposParaComparar = ["nome", "email", "matricula", "perfilId"] as const;
        const alteracoes = [];

        for (const campo of camposParaComparar) {
            const valorAntes = alunoAntes[campo];
            const valorDepois = alunoAtualizado[campo];

            if (valorAntes !== valorDepois) {
                alteracoes.push({
                    campo,
                    antes: valorAntes,
                    depois: valorDepois
                });
            }
        }

        if (dados.senha !== undefined && dados.senha.trim() !== "") {
            alteracoes.push({
                campo: "senha",
                antes: "********",
                depois: "SENHA_ALTERADA"
            });
        }

        if (alteracoes.length > 0) {
            eventEmmiter.emit("Aluno:Atualizado", {
                usuarioId,
                acao: "ATUALIZAÇÃO_PELO_ADMIN",
                entidade: "Aluno",
                entidadeId: id,
                detalhes: {
                    alteracoes
                }
            });
        }

        return alunoAtualizado;
    }
    async updateSenha(id: string, senha: string, usuarioId: string): Promise<Aluno> {
        const alunoExistente = await this._alunoPrismaRepository.getById(id);

        if (!alunoExistente) {
            throw new Error("ALUNO_INEXISTENTE");
        }

        if (id !== usuarioId) {
            throw new Error("NAO_AUTORIZADO");
        }

        if (senha.trim() === "") {
            throw new Error("SENHA_OBRIGATORIA");
        }

        const adminHouston = alunoExistente.email === "houston@sempreceub.com";
        const senhaParaHash = adminHouston ? senha + getPepper() : senha;

        const senhaHash = await bcrypt.hash(senhaParaHash, 10);

        const alunoAtualizado = await this._alunoPrismaRepository.updateSenha(id, senhaHash);

        if (!alunoAtualizado) {
            throw new Error("ERRO_AO_ATUALIZAR_SENHA");
        }

        eventEmmiter.emit("Aluno:Senha", {
            usuarioId: id,
            acao: "ATUALIZACAO_SENHA",
            entidade: "Aluno",
            entidadeId: id,
            detalhes: {
                mensagem: "Senha atualizada pelo usuario"
            }
        });

        return alunoAtualizado;
    }

    async delete(id: string, usuarioId: string): Promise<Aluno> {

        if (id === usuarioId) {
            throw new Error("AUTO_EXCLUSAO_NAO_PERMITIDA")
        }

        const alunoDados = await this._alunoPrismaRepository.delete(id)

        if (!alunoDados) {
            throw new Error("ALUNO_INEXISTENTE")
        }

        eventEmmiter.emit("Aluno:Deletado", {
            usuarioId,
            alunoId: alunoDados.id,
            aluno: {
                nome: alunoDados.nome,
                email: alunoDados.email,
                matricula: alunoDados.matricula,
            },
        });

        return alunoDados;
    }
}


export default AlunosService
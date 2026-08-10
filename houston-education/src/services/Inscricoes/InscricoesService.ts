import { Inscricao } from "@prisma/client";
import type InscricoesPrismaRepository from "../../repositories/Prisma/InscricoesPrismaRepository.js";
import MonitoriaPrismaRepository from "../../repositories/Prisma/MonitoriaPrismaRepository.js";
import AlunoPrismaRepository from "../../repositories/Prisma/AlunoPrismaRepository.js";
import { eventEmmiter } from "../../utils/events/Evento.js";



class InscricaosService{


    constructor(private _inscricaoPrismaRepository: InscricoesPrismaRepository){}

    async getAll() : Promise<Inscricao[]>{
        const InscricaosDados = await this._inscricaoPrismaRepository.getAll()
        return InscricaosDados;
    }
    
    async getInscricaoAluno(alunoId: string) : Promise<Inscricao[]>{
        const InscricaosDados = await this._inscricaoPrismaRepository.getInscricaoAluno(alunoId)
        return InscricaosDados;
    }

    async getByMonitoria(monitoriaId: string) : Promise<any[]>{
        const InscricaosDados = await this._inscricaoPrismaRepository.getByMonitoria(monitoriaId)
        return InscricaosDados;
    }

    async getMinhasInscricoes(alunoId: string, user: { id: string; perfil: string }) : Promise<any[]>{
        if (user.id !== alunoId) {
            throw new Error("MONITORIAS_ALHEIAS");
        }

        const InscricaosDados = await this._inscricaoPrismaRepository.getMinhasInscricoes(alunoId)
        return InscricaosDados;
    }

    async create(dados : Inscricao, usuarioId: string) : Promise<Inscricao>{
        const existeInscricao = await this._inscricaoPrismaRepository.findAlunoMonitoria(dados.alunoId, dados.monitoriaId)

        if (existeInscricao){
            throw new Error ("INSCRICAO_JA_EXISTE")
        }

        const dadosInscricaos = await this._inscricaoPrismaRepository.create(dados)

        // buscando informações para a auditoria
        const alunoRepository = new AlunoPrismaRepository();
        const monitoriaRepository = new MonitoriaPrismaRepository();

        const aluno = await alunoRepository.getById(dadosInscricaos.alunoId);
        const monitoria = await monitoriaRepository.getById(dadosInscricaos.monitoriaId);

        // emitindo o evento para a auditoria
        eventEmmiter.emit("Inscricao:Criada", {
            usuarioId,
            inscricaoId: dadosInscricaos.id.toString(),
            detalhes: {
                aluno: aluno?.nome || dadosInscricaos.alunoId,
                monitoria: monitoria?.nome_monitoria || dadosInscricaos.monitoriaId
            }
        });

        return dadosInscricaos;
    }
    async getById(id : number) : Promise <any>{
        const InscricaoDados = await this._inscricaoPrismaRepository.getById(id)

        if (!InscricaoDados){
            throw new Error ("Inscricao_INEXISTENTE")
        }
        return InscricaoDados;
    }

    async delete(id : number, usuarioId: string) : Promise <Inscricao>{
        const inscricaoExistente = await this.getById(id)

        const agora = new Date()

        if (new Date(inscricaoExistente.monitoria.inicio) <= agora){
            throw new Error ("MONITORIA_JA_OCORREU")
        }

        const InscricaoDados = await this._inscricaoPrismaRepository.delete(id)

        if (!InscricaoDados){
            throw new Error ("Inscricao_INEXISTENTE")
        }

        // buscando informações para a auditoria
        const alunoRepository = new AlunoPrismaRepository();
        const monitoriaRepository = new MonitoriaPrismaRepository();

        const aluno = await alunoRepository.getById(InscricaoDados.alunoId);
        const monitoria = await monitoriaRepository.getById(InscricaoDados.monitoriaId);

        // emitindo o evento para a auditoria
        eventEmmiter.emit("Inscricao:Removida", {
            usuarioId,
            inscricaoId: InscricaoDados.id.toString(),
            detalhes: {
                aluno: aluno?.nome || InscricaoDados.alunoId,
                monitoria: monitoria?.nome_monitoria || InscricaoDados.monitoriaId
            }
        });

        return InscricaoDados;
    }

    async salvarChamada(
        monitoriaId: string, atualizacoes: { id: number; presente: boolean }[], usuarioId: string, perfilUsuario: string ): Promise<Inscricao[]> {

        const monitoriaRepository = new MonitoriaPrismaRepository();
        const monitoria = await monitoriaRepository.getById(monitoriaId);

        if (!monitoria) {
            throw new Error("MONITORIA_NAO_ENCONTRADA");
        }

        const agora = new Date();
        
        if (new Date(monitoria.inicio) >= agora) {
            throw new Error("MONITORIA_NAO_OCORREU");
        }

        if (perfilUsuario !== "ADMIN" && monitoria.monitorId !== usuarioId) {
            throw new Error("NAO_AUTORIZADO");
        }

        const resultados = await this._inscricaoPrismaRepository.salvarChamada(atualizacoes);


        return resultados;
    }
}


export default InscricaosService
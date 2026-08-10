import { Request, Response } from "express";
import InscricoesService from "../../services/Inscricoes/InscricoesService.js";
import InscricoesPrismaRepository from "../../repositories/Prisma/InscricoesPrismaRepository.js";
import { AuthRequest } from "../../middlewares/autenticadoMiddleware.js";

const inscricoesService = new InscricoesService(new InscricoesPrismaRepository());

class InscricoesController {

    async getAll(Req: Request, Res: Response) {
        try {
            const inscricoesDados = await inscricoesService.getAll();
            Res.status(200).json(inscricoesDados)

        } catch (err: any) {
            return Res.status(500).json({ error: err.message })
        }
    }

    async getInscricaoAluno(Req: AuthRequest, Res: Response) {
        try {

            if (Req.user?.id == undefined) {
                return Res.status(500).json({ error: "USUARIO_SEM_TOKNEN" })
            }

            const alunoId = Req.user?.id;
            const inscricoesDados = await inscricoesService.getInscricaoAluno(alunoId);
            Res.status(200).json(inscricoesDados)

        } catch (err: any) {
            return Res.status(500).json({ error: err.message })
        }
    }

    async getByMonitoria(Req: Request, Res: Response) {
        try {
            const monitoriaId = Req.params.monitoriaId;
            const inscricoesDados = await inscricoesService.getByMonitoria(monitoriaId);
            return Res.status(200).json(inscricoesDados);
        } catch (err: any) {
            return Res.status(500).json({ error: err.message });
        }
    }
    
    async getById(Req: Request, Res: Response) {
        try {
            const id = parseInt(Req.params.id, 10);
            const inscricoesDados = await inscricoesService.getById(id)
            
            return Res.status(200).json(inscricoesDados)

        } catch (err: any) {
            return Res.status(400).json({ error: err.message })
        }
    }

    async getMinhasInscricoes(Req: AuthRequest, Res: Response) {
        try {
            const user = Req.user;
            if (!user) {
                return Res.status(401).json({ error: "USUARIO_NAO_AUTENTICADO" });
            }
            const id = Req.params.id;
            
            const inscricoesDados = await inscricoesService.getMinhasInscricoes(id, user);
            return Res.status(200).json(inscricoesDados);
        } catch (err: any) {
            if (err.message === "NAO_AUTORIZADO") {
                return Res.status(403).json({ error: err.message });
            }
            return Res.status(400).json({ error: err.message });
        }
    }

    async create(Req: AuthRequest, Res: Response) {
        try {
            const dados = Req.body;
            const usuarioId = Req.user?.id;

            if (!usuarioId) {
                return Res.status(401).json({ error: "USUARIO_NAO_AUTENTICADO" });
            }

            const dadosInscricoes = await inscricoesService.create(dados, usuarioId)
            return Res.status(201).json(dadosInscricoes);

        } catch (err: any) {
            return Res.status(400).json({ erro: err.message });
        }
    }

    async delete(Req: AuthRequest, Res: Response) {
        try {
            const id = parseInt(Req.params.id, 10);
            const usuarioId = Req.user?.id;

            if (!usuarioId) {
                return Res.status(401).json({ error: "USUARIO_NAO_AUTENTICADO" });
            }

            const inscricoesDados = await inscricoesService.delete(id, usuarioId)

            return Res.status(200).json(inscricoesDados)

        } catch (err: any) {
            return Res.status(400).json({ error: err.message })
        }
    }

    async salvarChamada(Req: AuthRequest, Res: Response) {
        try {
            const monitoriaId = Req.params.monitoriaId;
            const { inscricoes } = Req.body; // aqui eu pego o id da inscrição e o status do presente
            const usuarioId = Req.user?.id;
            const perfilUsuario = Req.user?.perfil;

            if (!usuarioId || !perfilUsuario) {
                return Res.status(401).json({ error: "USUARIO_NAO_AUTENTICADO" });
            }

            const resultado = await inscricoesService.salvarChamada(monitoriaId, inscricoes, usuarioId, perfilUsuario);
            return Res.status(200).json(resultado);

        } catch (err: any) {
            if (err.message === "MONITORIA_NAO_ENCONTRADA") {
                return Res.status(404).json({ error: err.message });
            }
            if (err.message === "MONITORIA_NAO_OCORREU" || err.message === "NAO_AUTORIZADO") {
                return Res.status(403).json({ error: err.message });
            }
            return Res.status(500).json({ error: err.message });
        }
    }
}


export default new InscricoesController;
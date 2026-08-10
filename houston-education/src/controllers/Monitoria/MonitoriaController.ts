import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/autenticadoMiddleware.js";
import MonitoriaService from "../../services/Monitoria/MonitoriaService.js";
import MonitoriaPrismaRepository from "../../repositories/Prisma/MonitoriaPrismaRepository.js";
import { UsuarioLogado } from "../../models/UsuarioLogado.js";

const monitoriaService = new MonitoriaService(new MonitoriaPrismaRepository);

class MonitoriaController{


    async getAll(Req : Request, Res : Response){
        try {
            const dadosMonitoria = await monitoriaService.getAll();
            return Res.status(200).json(dadosMonitoria)
        } catch (err : any) {
            Res.status(500).json({err : err.message})
        }
    }
    async getDisponiveis(Req : Request, Res : Response){
        try {
            const dadosMonitoria = await monitoriaService.getDisponiveis();
            return Res.status(200).json(dadosMonitoria)
        } catch (err : any) {
            Res.status(500).json({err : err.message})
        }
    }
    async getByMonitor(Req : Request, Res : Response){
        try {
            const { monitorId } = Req.params;
            const dadosMonitoria = await monitoriaService.getByMonitor(monitorId);
            return Res.status(200).json(dadosMonitoria)
        } catch (err : any) {
            Res.status(500).json({err : err.message})
        }
    }

    async getHistoricoMonitor(Req: Request, Res: Response) {
        try {
            const { monitorId } = Req.params;
            const user = (Req as AuthRequest).user;
            const dadosMonitoria = await monitoriaService.getHistoricoMonitor(monitorId, user!.id, user!.perfil);
            return Res.status(200).json(dadosMonitoria);
        } catch (err: any) {
            if (err.message === "ACESSO_NEGADO") {
                return Res.status(403).json({ error: err.message });
            }
            Res.status(500).json({ err: err.message });
        }
    }

    async getHistoricoAdmin(Req: Request, Res: Response) {
        try {
            const user = (Req as AuthRequest).user;
            const dadosMonitoria = await monitoriaService.getHistoricoAdmin(user!.perfil);
            return Res.status(200).json(dadosMonitoria);
        } catch (err: any) {
            if (err.message === "ACESSO_NEGADO") {
                return Res.status(403).json({ error: err.message });
            }
            Res.status(500).json({ err: err.message });
        }
    }

    async getById(Req : Request, Res : Response){
        try {
            const {id} = Req.params;
            const monitoriaDados = await monitoriaService.getById(id)

            return Res.status(200).json(monitoriaDados)

        } catch (err : any) {
            return Res.status(400).json({error : err.message})
        }
    }

    async getChamadaMonitoria(Req: Request, Res: Response) {
        try {
            const { id } = Req.params;
            const user = (Req as AuthRequest).user;
            const dadosChamada = await monitoriaService.getChamadaMonitoria(id, user!.id, user!.perfil);
            return Res.status(200).json(dadosChamada);
        } catch (err: any) {
            if (err.message === "MONITORIA_INEXISTENTE") {
                return Res.status(404).json({ error: err.message });
            }
            if (err.message === "ACESSO_NEGADO") {
                return Res.status(403).json({ error: err.message });
            }
            return Res.status(500).json({ error: err.message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const dados = req.body;
            const user = (req as AuthRequest).user;
            const monitoriaCriada = await monitoriaService.create(dados, user!.id);

            return res.status(201).json(monitoriaCriada);

        } catch (err: any) {
            if (err.message?.startsWith("HORARIO_INVALIDO")) {
                return res.status(400).json({ erro: err.message });
            }
            if (err.message?.startsWith("CONFLITO_HORARIO")) {
                return res.status(409).json({ erro: err.message });
            }
            console.log(err.message)
            return res.status(500).json({ erro: err.message });
        }
    }
    async update(Req: Request, Res: Response) {
        try {
            const { id } = Req.params;
            const dados = Req.body;
            const user = (Req as AuthRequest).user;

            const monitoriaDados = await monitoriaService.update(id, dados, user!.id, user!.perfil);

            return Res.status(200).json(monitoriaDados);
        } catch (err: any) {
            if (err.message === "MONITORIA_INEXISTENTE") {
                return Res.status(404).json({ error: err.message });
            }
            if (err.message === "MONITORIA_DE_OUTRO") {
                return Res.status(403).json({ error: err.message });
            }
            if (err.message?.startsWith("ATA_NAO_PERMITIDA")) {
                return Res.status(400).json({ error: err.message });
            }
            if (err.message?.startsWith("HORARIO_INVALIDO")) {
                return Res.status(400).json({ error: err.message });
            }
            if (err.message?.startsWith("CONFLITO_HORARIO")) {
                return Res.status(409).json({ error: err.message });
            }
            if (err.message === "CONFLITO_MONITORIA_EXISTENTE") {
                return Res.status(409).json({ error: "CONFLITO_MONITORIA_EXISTENTE" });
            }
            return Res.status(500).json({ error: err.message });
        }
    }
    async delete(Req : AuthRequest, Res : Response){
        try {
            const {id} = Req.params 
            const user = Req.user

            const monitoriaDados = await monitoriaService.delete(id, user!)

            return Res.status(200).json(monitoriaDados)
            
        } catch (err : any) {
            return Res.status(400).json({error : err.message})
        }
    }
}

export default new MonitoriaController;
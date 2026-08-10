import { Request, Response } from "express";
import DisciplinaService from "../../services/Disciplina/DisciplinaService.js";
import DisciplinaPrismaRepository from "../../repositories/Prisma/DisciplinaPrismaRepository.js";

const disciplinaService = new DisciplinaService(new DisciplinaPrismaRepository);

class DisciplinaController{


    async getAll(Req : Request, Res : Response){
        try {
            const cursoId = Req.query.cursoId ? parseInt(Req.query.cursoId as string, 10) : undefined;
            const dadosDisciplina = await disciplinaService.getAll(cursoId);
            return Res.status(200).json(dadosDisciplina)
        } catch (err : any) {
            Res.status(500).json({err : err.message})
        }
    }
    async create(req: Request, res: Response) {
        try {
            const dados = req.body;
            const disciplinaCriada = await disciplinaService.create(dados);

            return res.status(201).json(disciplinaCriada);

        } catch (err: any) {
            return res.status(500).json({ erro: "ERRO_INTERNO" });
        }
    }

    async getById(Req : Request, Res : Response){
        try {
            const id = parseInt(Req.params.id, 10);
            const disciplinaDados = await disciplinaService.getById(id)

            return Res.status(200).json(disciplinaDados)

        } catch (err : any) {
            return Res.status(400).json({error : err.message})
        }
    }
    async update(Req : Request, Res : Response){
        try {
            const id = parseInt(Req.params.id, 10);
            const dados = Req.body

            const disciplinaDados = await disciplinaService.update(id, dados)

            return Res.status(200).json(disciplinaDados)
        } catch (err : any) {
            return Res.status(400).json({error : err.message})
        }
    }
    async delete(Req : Request, Res : Response){
        try {
            const id = parseInt(Req.params.id, 10);
            const disciplinaDados = await disciplinaService.delete(id)

            return Res.status(200).json(disciplinaDados)

        } catch (err : any) {
            return Res.status(400).json({error : err.message})
        }
    }
}

export default new DisciplinaController;
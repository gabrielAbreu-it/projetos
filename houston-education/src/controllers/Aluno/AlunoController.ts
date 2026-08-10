import { Request, Response } from "express";
import AlunosService from "../../services/Aluno/AlunoService.js";
import AlunoPrismaRepository from "../../repositories/Prisma/AlunoPrismaRepository.js";
import { AuthRequest } from "../../middlewares/autenticadoMiddleware.js";
import jwt, { SignOptions } from "jsonwebtoken";

const alunoService = new AlunosService(new AlunoPrismaRepository());

class AlunoController{

    async getAll(Req : Request, Res : Response) {
        try {
            const perfil = Req.query.perfil as string | undefined;

            const skip = parseInt(Req.query.skip as string) || 0;
            const take = parseInt(Req.query.take as string) || 50;
            
            const alunosDados = await alunoService.getAll(perfil, skip, take);
            Res.status(200).json(alunosDados)

        } catch (err : any) {
            return Res.status(500).json({error : err.message})
        }
    }

    async getById(Req : Request, Res : Response){
        try {
            const {id} = Req.params;
            const alunosDados = await alunoService.getById(id)

            return Res.status(200).json(alunosDados)

    } catch (err : any) {
        return Res.status(400).json({error : err.message})
    }
    }
    async create(Req : Request, Res : Response){
        try {
            const dados = Req.body;

            let adminId : string | undefined;
            const auth = Req.headers.authorization
            const token = auth?.split(" ")[1]

            if (token && process.env.JWT_SECRET){
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
                console.log(decoded)
                if(decoded.perfil === "ADMIN"){
                    adminId = decoded.id
                }
            }
            
            const dadosAlunos = await alunoService.create(dados, adminId)

            return Res.status(200).json(dadosAlunos);
            
        } catch (err : any) {
            return Res.status(400).json({ erro: err.message });
        }
    }
    
    async update(Req : Request, Res : Response){
        try {
            const {id} = Req.params
            const dados = Req.body

            const alunoDados = await alunoService.update(id, dados)


            return Res.status(200).json(alunoDados)
        } catch (err : any) {
            Res.status(400).json({error : err.message})
        }
    }
    async updateUsuarioByAdmin(Req : Request, Res : Response){
        try {
            const { id } = Req.params;
            const dados = { ...Req.body };
            const user = (Req as AuthRequest).user;

            if (dados.perfilId !== undefined) {
                dados.perfilId = parseInt(dados.perfilId, 10);
            }

            const alunoDados = await alunoService.updateUsuarioByAdmin(id, dados, user!.id);

            return Res.status(200).json(alunoDados);
        } catch (err : any) {
            if (err.message === "ALUNO_INEXISTENTE") {
                return Res.status(404).json({ error: err.message });
            }
            if (err.message === "EMAIL_EXISTE") {
                return Res.status(409).json({ erro: "EMAIL_EXISTE" });
            }
            if (err.message === "MATRICULA_EXISTE") {
                return Res.status(409).json({ erro: "MATRICULA_EXISTE" });
            }
            if (err.message === "MATRICULA_OU_EMAIL_EM_USO") {
                return Res.status(409).json({ erro: "MATRICULA_OU_EMAIL_EM_USO" });
            }
            return Res.status(400).json({ error: err.message });
        }
    }
    async updateSenha(Req: Request, Res: Response) {
        try {
            const { id } = Req.params;
            const { senha, senhaConfirmada } = Req.body;

            if (senha != senhaConfirmada){
                throw new Error ("SENHAS_NAO_COINCIDEM")
            }
            
            const usuario = (Req as any).user;

            const alunoDados = await alunoService.updateSenha(id, senha, usuario.id);

            return Res.status(200).json(alunoDados);
            
        } catch (err: any) {
            if (err.message === "NAO_AUTORIZADO") {
                return Res.status(403).json({ error: err.message });
            }
            if (err.message === "ALUNO_INEXISTENTE") {
                return Res.status(404).json({ error: err.message });
            }
            if (err.message === "SENHA_OBRIGATORIA") {
                return Res.status(400).json({ error: err.message });
            }
            return Res.status(400).json({ error: err.message });
        }
    }

    async delete(Req : Request, Res : Response){
        try {

            const {id} = Req.params
            const user = (Req as AuthRequest).user;
            const alunoDados = await alunoService.delete(id, user!.id)

            return Res.status(200).json(alunoDados)

        } catch (err : any) {
            if (err.message === "AUTO_EXCLUSAO_NAO_PERMITIDA") {
                return Res.status(403).json({ error: err.message });
            }
            return Res.status(400).json({error : err.message})
        }
    }

}


export default AlunoController;
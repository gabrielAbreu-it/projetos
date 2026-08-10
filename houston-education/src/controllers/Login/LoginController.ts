import { Request, Response } from "express";
import AuthService from "../../services/Login/LoginService.js";
import AlunoPrismaRepository from "../../repositories/Prisma/AlunoPrismaRepository.js";
import { generateJWT } from "../../utils/jwt/jwt.js";


const authService = new AuthService(new AlunoPrismaRepository());

class LoginController{

    async login(Req : Request, Res : Response){

        try {            
            const dados = Req.body
            
            dados.senha = dados.senha?.trim();
            dados.email = dados.email?.trim();

            if (!dados.email || !dados.senha){
                return Res.json({erro : "Os dados devem ser preenchidos!"})
            }

            const user = await authService.validateUser(dados.email, dados.senha)

            //colocar isso no service
            const perfilNome = (user.perfil as any)?.nome || "";
            const token = await generateJWT({id : user.id, nome : user.nome, email : user.email, matricula : user.matricula, perfil : perfilNome} , "2h");

            Res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 2 * 60 * 60 * 1000 // 2 horas
            });

            Res.status(200).json({token})


            
        } catch (err : any) {
            if(err.message === "CREDENCIAIS_INVALIDAS"){
                return Res.status(401).json({ erro: "CREDENCIAIS_INVALIDAS" });
            }
            if(err.message === "USUARIO_INEXISTENTE"){
                return Res.status(401).json({ erro: "USUARIO_INEXISTENTE" });
            }
            return Res.status(500).json({ erro: "ERRO_INTERNO" });
        }
    }
}

export default LoginController;
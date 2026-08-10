
import AlunoPrismaRepository from "../../repositories/Prisma/AlunoPrismaRepository.js"
import bcrypt from "bcrypt"
import { getPepper } from "../../utils/security/pepper.js";
import { eventEmmiter } from "../../utils/events/Evento.js";


class AuthService{

    constructor(private _alunoPrismaRepository : AlunoPrismaRepository){}

    async validateUser(email : string, senha : string){ // literalmente validando o login do usuário

        const user = await this.existeUser(email)


        const adminHouston = user.email === "houston@sempreceub.com"; // pepper exclusivo para o admin Houston

        const senhaParaComparar = adminHouston ? senha + getPepper() : senha; //se for o admin específico, uso a senha + pepper

        const senhaValida = await bcrypt.compare(senhaParaComparar, user.senha)

        if(!user || !senhaValida){
            throw new Error ("CREDENCIAIS_INVALIDAS");
        }


        eventEmmiter.emit("Aluno:Login", { // evento de auditoria de login 
            usuarioId: user.id,
            acao: "LOGIN",
            entidade: "Aluno",
            entidadeId: user.id,
            detalhes: {
                email: user.email,
                matricula: user.matricula
            }
        });

        return user;
    }

    async existeUser(email: string) { // vendo se ele já existe
        const user = await this._alunoPrismaRepository.findByEmailAndMatricula(email, "")

        if (!user) {
            throw new Error("USUARIO_INEXISTENTE")
        }

        return user;
    }
}

export default AuthService;
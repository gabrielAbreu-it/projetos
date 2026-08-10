import jwt, { SignOptions } from "jsonwebtoken";
import "dotenv/config";

export const generateJWT = async (
  aluno: { id: string; email: string; nome: string; matricula?: string; perfil?: string },
  expiresIn: string
): Promise<string> => {
  const secret: string = process.env.JWT_SECRET || "default";

  const option: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };

  const payloadDados = {
    id: aluno.id,
    nome: aluno.nome,
    email: aluno.email,
    matricula: aluno.matricula,
    perfil: aluno.perfil,
  };

  const token = jwt.sign(payloadDados, secret, option);

  return token;
};
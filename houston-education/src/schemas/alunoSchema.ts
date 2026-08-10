import * as yup from 'yup'

const perfisValidos = [1,2,3]

const idSchema = yup.string().uuid().required("ID_OBRIGATORIO");

export const alunoGetByIdSchema = yup.object({
    id : idSchema
}).noUnknown();

// validação de id e de dados diferentes para a rota put

export const alunoUpdateIdSchema = yup.object({
    id : idSchema
}).noUnknown();

export const alunoUpdateSchema = yup.object({
    nome : yup.string().optional(),
    email : yup.string().email().optional(),
    matricula: yup.string().matches(/^\d{8,11}$/, "Matrícula deve conter entre 8 e 11 dígitos numéricos").optional()
}).noUnknown();

export const alunoUpdateSenha = yup.object({
    senha : yup.string().required(),
    senhaConfirmada : yup.string().oneOf([yup.ref('senha')], "SENHAS_NAO_COINCIDEM").required()
}).noUnknown();


export const alunoCreateSchema = yup.object({
    nome : yup.string().required(),
    senha : yup.string().required(),
    email : yup.string().email().required(),
    matricula : yup.string().matches(/^\d{8,11}$/, "Matrícula deve conter entre 8 e 11 dígitos numéricos").required(),
}).noUnknown();

export const alunoUpdatePerfilSchema = yup.object({
    perfilId: yup.number().integer().oneOf(perfisValidos).optional(),
    nome: yup.string().optional(),
    email: yup.string().email().optional(),
    matricula: yup.string().matches(/^\d{8,11}$/, "Matrícula deve conter entre 8 e 11 dígitos numéricos").optional(),
    senha: yup.string().optional(),
}).noUnknown();

export const alunoDeleteSchema = yup.object({
    id : idSchema
}).noUnknown();


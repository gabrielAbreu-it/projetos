import * as yup from 'yup'

const idSchema = yup.number().integer().required("ID_OBRIGATORIO");

export const cursoGetByIdSchema = yup.object({
    id: idSchema
}).noUnknown();

export const cursoCreateSchema = yup.object({
    nome: yup.string().required("NOME_OBRIGATORIO"),
    descricao: yup.string().optional()
}).noUnknown();

export const cursoUpdateSchema = yup.object({
    nome: yup.string().optional(),
    descricao: yup.string().optional()
}).noUnknown();

export const cursoDeleteSchema = yup.object({
    id: idSchema
}).noUnknown();

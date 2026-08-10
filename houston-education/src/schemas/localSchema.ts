import * as yup from 'yup'

const idSchema = yup.number().required("ID_OBRIGATORIO");

export const localGetByIdSchema = yup.object({
    id: idSchema
}).noUnknown();

export const localCreateSchema = yup.object({
    nome: yup.string().required("NOME_OBRIGATORIO"),
    descricao: yup.string().optional(),
    campusId: yup.string().required("CAMPUS_ID_OBRIGATORIO")
}).noUnknown();

export const localUpdateSchema = yup.object({
    nome: yup.string().optional(),
    descricao: yup.string().optional(),
    campusId: yup.string().optional()
}).noUnknown();

export const schema = {
    localGetByIdSchema,
    localCreateSchema,
    localUpdateSchema
};

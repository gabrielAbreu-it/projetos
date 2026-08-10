import { randomUUID } from 'crypto';
import * as yup from 'yup'


const idSchema = yup.number().required("ID_OBRIGATORIO");

export const inscricoesGetByIdSchema = yup.object({
    id : yup.string().uuid().required("ID_OBRIGATORIO")
}).noUnknown();

export const inscricoesDeleteSchema = yup.object({
    id : idSchema
}).noUnknown();

export const inscricoesCreateSchema = yup.object({
    alunoId : yup.string().uuid().required(),
    monitoriaId : yup.string().uuid().required()
}).noUnknown();

export const inscricoesSalvarChamadaSchema = yup.object({
    inscricoes: yup.array().of(
        yup.object({
            id: yup.number().required("ID_OBRIGATORIO"),
            presente: yup.boolean().required("PRESENTE_OBRIGATORIO")
        })
    ).required("INSCRICOES_OBRIGATORIAS")
}).noUnknown();

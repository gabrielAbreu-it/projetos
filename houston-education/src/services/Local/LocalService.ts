import LocalPrismaRepository from "../../repositories/Prisma/LocalPrismaRepository.js";
import { Local, Prisma } from "@prisma/client";
import { UpdateLocal } from "../../models/Local.js";

class LocalService {
  constructor(private _localRepository: LocalPrismaRepository) {}

  async getAll(): Promise<Local[]> {
    const locais = await this._localRepository.getAll();
    return locais;
  }

  async create(dados: Prisma.LocalUncheckedCreateInput): Promise<Local> {
    const campusId = typeof dados.campusId === "string" ? parseInt(dados.campusId, 10) : dados.campusId;
    if (!campusId || isNaN(campusId)) {
      throw new Error("CAMPUS_INVALIDO");
    }

    const existente = await this._localRepository.findByNomeAndCampus(dados.nome, campusId);
    if (existente) {
      throw new Error("LOCAL_DUPLICADO");
    }

    const local = await this._localRepository.create({ ...dados, campusId });
    return local;
  }

  async getById(id: number): Promise<Local> {
    const local = await this._localRepository.getById(id);
    if (!local) {
      throw new Error("LOCAL_INEXISTENTE");
    }
    return local;
  }

  async update(id: number, dados: UpdateLocal): Promise<Local> {
    await this.getById(id);

    const dadosAtualizados: Prisma.LocalUncheckedUpdateInput = {};

    if (dados.nome) {
      dadosAtualizados.nome = dados.nome;
    }

    if (dados.descricao) {
      dadosAtualizados.descricao = dados.descricao;
    }

    if (dados.campusId) {
      dadosAtualizados.campusId = dados.campusId as number;
    }

    const localAtualizado = await this._localRepository.update(id, dadosAtualizados);

    if (!localAtualizado) {
      throw new Error("ERRO_AO_ATUALIZAR");
    }

    return localAtualizado;
  }

  async delete(id: number): Promise<Local> {
    await this.getById(id);
    const localApagar = await this._localRepository.delete(id);

    if (!localApagar) {
      throw new Error("ERRO_AO_APAGAR_LOCAL");
    }
    return localApagar;
  }
}

export default LocalService;

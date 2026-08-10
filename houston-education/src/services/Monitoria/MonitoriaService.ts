import { json } from "stream/consumers";
import MonitoriaPrismaRepository from "../../repositories/Prisma/MonitoriaPrismaRepository.js";
import { Monitoria } from "@prisma/client";
import { eventEmmiter } from "../../utils/events/Evento.js";
import { UsuarioLogado } from "../../models/UsuarioLogado.js";

interface MonitoriaInput {
  nome_monitoria: string;
  descricao?: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  localId: string;
  monitorId: string;
  disciplinaId: string;
  ata?: string;
} // preciso tirar isso daqui e colocar no model

// essas funções foram criadas para resolver o problema de 3h atrasadas que ficavam as monitorias em produção
function criarDateBRT(data: string, hora: string): Date {
  return new Date(`${data}T${hora}:00-03:00`);
}

function extrairHoraBRT(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}



class MonitoriaService {
  constructor(private _monitoriaRepository: MonitoriaPrismaRepository) { }

  async getAll(): Promise<Monitoria[]> {
    const dadosmonitoria = await this._monitoriaRepository.getAll();
    return dadosmonitoria;
  } // get de todas as monitorias do sistema

  async getDisponiveis(): Promise<Monitoria[]> {
    const dadosmonitoria = await this._monitoriaRepository.getDisponiveis();
    return dadosmonitoria;
  } // get de todas as monitorias que ainda vão acontecer

  async getByMonitor(monitorId: string): Promise<Monitoria[]> {
    const dadosmonitoria = await this._monitoriaRepository.getByMonitor(monitorId);
    return dadosmonitoria;
  } // get de todas as monitorias de um monitor específico

  async getHistoricoMonitor(monitorId: string, usuarioId: string, perfil: string): Promise<any[]> {
    if ((perfil === "MONITOR" && monitorId !== usuarioId) || perfil === "ALUNO") {
      throw new Error("ACESSO_NEGADO");
    }

    const dadosmonitoria = await this._monitoriaRepository.getHistoricoMonitor(monitorId);

    return dadosmonitoria.map((m: any) => ({
      id: m.id,
      nome: m.nome_monitoria,
      disciplina: { nome: m.disciplina.nome },
      monitor: { nome: m.monitor.nome },
      data: m.inicio.toISOString().split("T")[0],
      inicio: extrairHoraBRT(m.inicio),
      fim: extrairHoraBRT(m.fim),
      inscritos: m._count.inscricoes,
      presentes: m.inscricoes.length,
      temChamada: m._count.inscricoes > 0,
    }));
  } // histórico das monitorias de um monitor específico 

  async getHistoricoAdmin(perfil: string): Promise<any[]> {
    if (perfil !== "ADMIN") {
      throw new Error("ACESSO_NEGADO");
    }

    const dadosmonitoria = await this._monitoriaRepository.getHistoricoAdmin();

    return dadosmonitoria.map((m: any) => ({
      id: m.id,
      nome: m.nome_monitoria,
      disciplina: { nome: m.disciplina.nome },
      monitor: { nome: m.monitor.nome },
      data: m.inicio.toISOString().split("T")[0],
      inicio: extrairHoraBRT(m.inicio),
      fim: extrairHoraBRT(m.fim),
      inscritos: m._count.inscricoes,
      presentes: m.inscricoes.length,
      temChamada: m._count.inscricoes > 0,
    }));
  } // histórico de todas as monitorias 

  async getById(id: string): Promise<Monitoria> {
    const monitoriaDados = await this._monitoriaRepository.getById(id);

    if (!monitoriaDados) {
      throw new Error("MONITORIA_INEXISTENTE");
    }

    return monitoriaDados;
  } // monitoria pelo id 

  async getChamadaMonitoria(monitoriaId: string, usuarioId: string, perfil: string): Promise<any[]> {
    const monitoria = await this._monitoriaRepository.getById(monitoriaId);

    if (!monitoria) {
      throw new Error("MONITORIA_INEXISTENTE");
    }

    if (perfil === "MONITOR" && monitoria.monitorId !== usuarioId) {
      throw new Error("ACESSO_NEGADO");
    }

    const dadosChamada = await this._monitoriaRepository.getChamadaMonitoria(monitoriaId);

    return dadosChamada;
  } // chamada de uma monitoria, pega quem são os alunos inscritos

  async create(dados: MonitoriaInput, usuarioId: string): Promise<Monitoria> {
    const inicio = criarDateBRT(dados.data, dados.hora_inicio);
    const fim = criarDateBRT(dados.data, dados.hora_fim);

    if (inicio >= fim) {
      throw new Error("HORARIO_INVALIDO: O horário de início deve ser anterior ao horário de fim.");
    }


    const dadosFormatados: any = {
      nome_monitoria: dados.nome_monitoria,
      inicio,
      fim,
      monitorId: dados.monitorId,
      disciplinaId: parseInt(dados.disciplinaId, 10),
      localId : parseInt (dados.localId, 10)
      };

    if (dados.descricao) {
      dadosFormatados.descricao = dados.descricao;
    }

    const conflito = await this._monitoriaRepository.conflitoHorario(dadosFormatados.localId, inicio, fim)

    if (conflito){
      throw new Error ("CONFLITO_HORARIO_MONITORIA")
    }

    const monitoriaNova = await this._monitoriaRepository.create(dadosFormatados)


    // emitindo o evento para a auditoria
    const eventoCreateMonitoria = eventEmmiter.emit("Monitoria:Criada", {
      usuarioId,
      monitoriaId: monitoriaNova.id,
      monitoria: {
        nome: monitoriaNova.nome_monitoria,
        data: monitoriaNova.inicio.toISOString(),
        monitorId: monitoriaNova.monitorId,
      },
    });

    return monitoriaNova;
  } // cria monitoria

  async update(id: string, dados: Partial<MonitoriaInput>, usuarioId: string, perfil: string): Promise<Monitoria> {
    const monitoriaAtual = await this._monitoriaRepository.getById(id);

    //monitoria existe
    if (!monitoriaAtual) {
      throw new Error("MONITORIA_INEXISTENTE");
    }

    // permissão de edição
    if (perfil !== "ADMIN" && monitoriaAtual.monitorId !== usuarioId) {
      throw new Error("MONITORIA_DE_OUTRO");
    }

    //vendo se existe ata
    if (dados.ata !== undefined) {
      const agora = new Date();

      if (agora < monitoriaAtual.inicio) {
        throw new Error("ATA_NAO_PERMITIDA: A ata só pode ser preenchida após o início da monitoria");
      }
    }

    // lógica para atualização de horário e dia
    const dataAtual = monitoriaAtual.inicio.toISOString().split("T")[0];
    const horaInicioAtual = extrairHoraBRT(monitoriaAtual.inicio);
    const horaFimAtual = extrairHoraBRT(monitoriaAtual.fim);

    const dataString = dados.data ?? dataAtual; // o campo de data está vindo? se não, continue usando o do banco
    const horaInicioString = dados.hora_inicio ?? horaInicioAtual;
    const horaFimString = dados.hora_fim ?? horaFimAtual;

    const inicio = criarDateBRT(dataString, horaInicioString);
    const fim = criarDateBRT(dataString, horaFimString);

    if (inicio >= fim) {
      throw new Error("HORARIO_INVALIDO: O horário de início deve ser anterior ao horário de fim.");
    }

    const dadosAtualizados: any = { // criei esse objeto logo aqui para poder atribuir a ele o resto das informações de update nos ifs
      ...dados, 
      inicio,
      fim,
    };

    // deleto esses campos pois eles são apenas auxíliares para os campos reais ( inicio e fim)
    delete dadosAtualizados.data;
    delete dadosAtualizados.hora_inicio;
    delete dadosAtualizados.hora_fim;

    if (dados.disciplinaId) {
      dadosAtualizados.disciplinaId = parseInt(dados.disciplinaId, 10);
    }

    if (dados.localId) {
      dadosAtualizados.localId = parseInt(dados.localId, 10);
    }

    // checagem de conflito de monitoria
    const conflito = await this._monitoriaRepository.conflitoHorario(dadosAtualizados.localId, dadosAtualizados.inicio, dadosAtualizados.fim, id)

    
    if (conflito){
      throw new Error ("CONFLITO_MONITORIA_EXISTENTE")
    }

    const dadosMonitoria = await this._monitoriaRepository.update(
      id,
      dadosAtualizados
    );

    if (!dadosMonitoria) {
      throw new Error("ERRO_AO_ATUALIZAR");
    }

    // auditoria
    const camposParaComparar = [
      "nome_monitoria",
      "descricao",
      "monitorId",
      "disciplinaId",
      "localId",
      "ata"
    ] as const;

    const alteracoes = [];

    for (const campo of camposParaComparar) {
      const valorAntes = monitoriaAtual[campo];
      const valorDepois = dadosMonitoria[campo];

      if (valorAntes !== valorDepois) {
        alteracoes.push({
          campo,
          antes: valorAntes,
          depois: valorDepois
        });
      }
    }

    // é necessário comparar usando o toIsoString os campos de hora de início e de fim separadamente, pq usando o tipo Date, a comparação !== sempre retornaria true mesmo que eu não altere a data

    if (monitoriaAtual.inicio.toISOString() !== dadosMonitoria.inicio.toISOString()) {
      alteracoes.push({
        campo: "inicio",
        antes: monitoriaAtual.inicio.toISOString(),
        depois: dadosMonitoria.inicio.toISOString()
      });
    }

    if (monitoriaAtual.fim.toISOString() !== dadosMonitoria.fim.toISOString()) {
      alteracoes.push({
        campo: "fim",
        antes: monitoriaAtual.fim.toISOString(),
        depois: dadosMonitoria.fim.toISOString()
      });
    }

    if (alteracoes.length > 0) {
      eventEmmiter.emit("Monitoria:Atualizada", {
        usuarioId,
        acao: "MONITORIA_ATUALIZADA",
        entidade: "Monitoria",
        entidadeId: id,
        detalhes: {
          alteracoes
        }
      });
    }

    return dadosMonitoria;
  } // atualiza monitoria

  async delete(id: string, user : UsuarioLogado): Promise<Monitoria> {

    const monitoriaExistente = await this._monitoriaRepository.getById(id)

    if (!monitoriaExistente){
      throw new Error ("MONITORIA_INEXISTENTE")
    }

    if (monitoriaExistente.monitorId != user.id && user.perfil != "ADMIN"){
      throw new Error ("EXCLUSAO_NAO_PERMITIDA")
    }

    const monitoriaExcluida = await this._monitoriaRepository.delete(id);

    eventEmmiter.emit("Monitoria:Deletada", {
      usuarioId: user.id,
      monitoriaId: monitoriaExcluida.id,
      monitoria: {
        nome: monitoriaExcluida.nome_monitoria,
        data: monitoriaExcluida.inicio.toISOString(),
        monitorId: monitoriaExcluida.monitorId,
      },
    });

    return monitoriaExcluida;
  } // deleta monitoria
}

export default MonitoriaService;
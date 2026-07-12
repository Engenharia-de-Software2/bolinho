import { API_URL } from "../config";
import { obterToken } from "./storage";

/**
 * Erro de API com status HTTP e mensagem vinda do backend, para que as
 * telas possam mostrar a mensagem certa ao usuário.
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function requisitar(caminho, { method = "GET", body, autenticado = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (autenticado) {
    const token = await obterToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    // Erro de rede: backend fora do ar, URL errada, sem internet, etc.
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique se o backend está rodando.",
      0,
    );
  }

  let dados = null;
  try {
    dados = await resposta.json();
  } catch (error) {
    dados = null;
  }

  if (!resposta.ok) {
    throw new ApiError(
      dados?.message || "Ocorreu um erro inesperado.",
      resposta.status,
    );
  }

  return dados;
}

// ------------------------------- Autenticação -------------------------------
export const AuthAPI = {
  registrar: (nome, email, senha) =>
    requisitar("/auth/register", {
      method: "POST",
      body: { nome, email, senha },
      autenticado: false,
    }),

  login: (email, senha) =>
    requisitar("/auth/login", {
      method: "POST",
      body: { email, senha },
      autenticado: false,
    }),

  me: () => requisitar("/auth/me"),
};

// --------------------------------- Bolões ------------------------------------
export const BoloesAPI = {
  criar: (nome, tipo, descricao) =>
    requisitar("/boloes", { method: "POST", body: { nome, tipo, descricao } }),

  listarMeus: () => requisitar("/boloes/meus"),

  detalhar: (id) => requisitar(`/boloes/${id}`),

  entrar: (codigo) =>
    requisitar("/boloes/entrar", { method: "POST", body: { codigo } }),

  convidar: (id, email) =>
    requisitar(`/boloes/${id}/convidar`, { method: "POST", body: { email } }),

  excluirOuSair: (id) => requisitar(`/boloes/${id}`, { method: "DELETE" }),

  ranking: (id) => requisitar(`/boloes/${id}/ranking`),
};

// -------------------------------- Partidas ------------------------------------
export const PartidasAPI = {
  criar: (bolaoId, time_a, time_b, data_hora) =>
    requisitar(`/boloes/${bolaoId}/partidas`, {
      method: "POST",
      body: { time_a, time_b, data_hora },
    }),

  listar: (bolaoId) => requisitar(`/boloes/${bolaoId}/partidas`),

  atualizarResultado: (partidaId, resultado_a, resultado_b) =>
    requisitar(`/partidas/${partidaId}/resultado`, {
      method: "PUT",
      body: { resultado_a, resultado_b },
    }),
};

// -------------------------------- Apostas -------------------------------------
export const ApostasAPI = {
  salvar: (partidaId, placar_time_a, placar_time_b) =>
    requisitar(`/partidas/${partidaId}/apostas`, {
      method: "POST",
      body: { placar_time_a, placar_time_b },
    }),
};

// ------------------------------ Notificações -----------------------------------
export const NotificacoesAPI = {
  listar: () => requisitar("/notificacoes"),

  marcarLida: (id) =>
    requisitar(`/notificacoes/${id}/lida`, { method: "PUT" }),

  marcarTodasLidas: () =>
    requisitar("/notificacoes/lidas", { method: "PUT" }),
};

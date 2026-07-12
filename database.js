class Database {
  constructor() {
    this.usuarios = [];
    this.boloes = [];
    this.participantes = []; // { bolao_id, usuario_id }
    this.partidas = [];
    this.apostas = [];
    this.notificacoes = []; // { id, usuario_id, tipo, titulo, mensagem, lida }
  }
}

export const db = new Database();
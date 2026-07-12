import { db } from "../database.js";

class NotificacoesController {
  // GET /notificacoes
  async listar(req, res) {
    const minhas = db.notificacoes
      .filter((n) => n.usuario_id === req.usuario.id)
      .slice()
      .reverse();

    return res.status(200).json({ notificacoes: minhas });
  }

  // PUT /notificacoes/:id/lida
  async marcarLida(req, res) {
    const { id } = req.params;
    const notificacao = db.notificacoes.find(
      (n) => n.id === id && n.usuario_id === req.usuario.id,
    );
    if (!notificacao) {
      return res.status(404).json({ message: "Notificação não encontrada" });
    }
    notificacao.lida = true;
    return res.status(200).json({ notificacao });
  }

  // PUT /notificacoes/lidas
  async marcarTodasLidas(req, res) {
    db.notificacoes
      .filter((n) => n.usuario_id === req.usuario.id)
      .forEach((n) => {
        n.lida = true;
      });
    return res.status(200).json({ message: "Notificações marcadas como lidas" });
  }
}

export default new NotificacoesController();

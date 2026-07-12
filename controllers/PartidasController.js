import { v4 as uuidv4 } from "uuid";
import { db } from "../database.js";

class PartidasController {
  // POST /boloes/:bolaoId/partidas  (apenas organizador)
  async criar(req, res) {
    const { bolaoId } = req.params;
    const { time_a, time_b, data_hora } = req.body;

    const bolao = db.boloes.find((b) => b.id === bolaoId);
    if (!bolao) {
      return res.status(404).json({ message: "Bolão não encontrado" });
    }
    if (bolao.criador_id !== req.usuario.id) {
      return res
        .status(403)
        .json({ message: "Apenas o organizador pode cadastrar partidas" });
    }
    if (!time_a || !time_b) {
      return res.status(400).json({ message: "Informe os dois times" });
    }

    const novaPartida = {
      id: uuidv4(),
      bolao_id: bolaoId,
      time_a: time_a.trim(),
      time_b: time_b.trim(),
      data_hora: (data_hora || "").trim() || "Data a definir",
      resultado_a: null,
      resultado_b: null,
      status: "agendada",
    };

    db.partidas.push(novaPartida);

    return res.status(201).json({ partida: novaPartida });
  }

  // GET /boloes/:bolaoId/partidas
  async listar(req, res) {
    const { bolaoId } = req.params;

    const bolao = db.boloes.find((b) => b.id === bolaoId);
    if (!bolao) {
      return res.status(404).json({ message: "Bolão não encontrado" });
    }

    const partidas = db.partidas
      .filter((p) => p.bolao_id === bolaoId)
      .map((partida) => {
        const minhaAposta = db.apostas.find(
          (a) => a.partida_id === partida.id && a.usuario_id === req.usuario.id,
        );
        return { ...partida, minha_aposta: minhaAposta || null };
      });

    return res.status(200).json({ partidas });
  }

  // PUT /partidas/:id/resultado  (apenas organizador do bolão)
  async atualizarResultado(req, res) {
    const { id } = req.params;
    const { resultado_a, resultado_b } = req.body;

    // buscarPartida(id)
    const partida = db.partidas.find((p) => p.id === id);
    if (!partida) {
      return res.status(404).json({ message: "Partida não encontrada" });
    }

    const bolao = db.boloes.find((b) => b.id === partida.bolao_id);
    if (bolao && bolao.criador_id !== req.usuario.id) {
      return res
        .status(403)
        .json({ message: "Apenas o organizador pode definir o resultado" });
    }

    // editarPartida(resultado_a, resultado_b, status=finalizada)
    partida.resultado_a = parseInt(resultado_a, 10);
    partida.resultado_b = parseInt(resultado_b, 10);
    partida.status = "finalizada";

    // calcularPontuacao(partida) -> buscarApostas(partida_id)
    const apostasDaPartida = db.apostas.filter((a) => a.partida_id === id);

    // loop [para cada aposta]
    apostasDaPartida.forEach((aposta) => {
      let pontosGanhos = 0;

      // compara placar_apostado com resultado
      if (
        aposta.placar_time_a === partida.resultado_a &&
        aposta.placar_time_b === partida.resultado_b
      ) {
        pontosGanhos = 10; // Placar em cheio
      } else if (
        Math.sign(aposta.placar_time_a - aposta.placar_time_b) ===
        Math.sign(partida.resultado_a - partida.resultado_b)
      ) {
        pontosGanhos = 5; // Acertou apenas o vencedor/empate
      }

      // atualizarPontos(aposta, pontos)
      aposta.pontos = pontosGanhos;

      // Atualiza também os pontos totais do respectivo usuário
      const usuario = db.usuarios.find((u) => u.id === aposta.usuario_id);
      if (usuario) usuario.pontos_totais = (usuario.pontos_totais || 0) + pontosGanhos;

      // registrarNotificacao(usuario) -> NotificacaoService
      db.notificacoes.push({
        id: uuidv4(),
        usuario_id: aposta.usuario_id,
        tipo: "RESULTADO_PARTIDA",
        titulo: "Resultado atualizado ⚽",
        mensagem: `${partida.time_a} ${partida.resultado_a} x ${partida.resultado_b} ${partida.time_b} — você ganhou ${pontosGanhos} pontos.`,
        lida: false,
      });
    });

    // 200 OK { resultado, ranking atualizado }
    return res.status(200).json({
      message: "Partida finalizada e pontuações calculadas.",
      partida,
      ranking: db.usuarios
        .map((u) => ({ nome: u.nome, pontos: u.pontos_totais }))
        .sort((a, b) => b.pontos - a.pontos),
    });
  }
}

export default new PartidasController();

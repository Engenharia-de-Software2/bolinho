import { v4 as uuidv4 } from "uuid";
import { db } from "../database.js";

class ApostasController {
  // POST /partidas/:id/apostas  { placar_time_a, placar_time_b }
  async criarOuAtualizar(req, res) {
    const { id } = req.params; // partida_id
    const { placar_time_a, placar_time_b } = req.body;

    const partida = db.partidas.find((p) => p.id === id);
    if (!partida) {
      return res.status(404).json({ message: "Partida não encontrada" });
    }
    if (partida.status === "finalizada") {
      return res
        .status(409)
        .json({ message: "Esta partida já foi finalizada, não é possível apostar" });
    }

    const souParticipante = db.participantes.some(
      (p) => p.bolao_id === partida.bolao_id && p.usuario_id === req.usuario.id,
    );
    if (!souParticipante) {
      return res
        .status(403)
        .json({ message: "Você não participa do bolão desta partida" });
    }

    if (
      placar_time_a === undefined ||
      placar_time_b === undefined ||
      placar_time_a === "" ||
      placar_time_b === ""
    ) {
      return res.status(400).json({ message: "Informe o placar dos dois times" });
    }

    const apostaExistente = db.apostas.find(
      (a) => a.partida_id === id && a.usuario_id === req.usuario.id,
    );

    if (apostaExistente) {
      apostaExistente.placar_time_a = parseInt(placar_time_a, 10);
      apostaExistente.placar_time_b = parseInt(placar_time_b, 10);
      return res.status(200).json({ aposta: apostaExistente });
    }

    const novaAposta = {
      id: uuidv4(),
      partida_id: id,
      bolao_id: partida.bolao_id,
      usuario_id: req.usuario.id,
      placar_time_a: parseInt(placar_time_a, 10),
      placar_time_b: parseInt(placar_time_b, 10),
      pontos: 0,
    };
    db.apostas.push(novaAposta);

    return res.status(201).json({ aposta: novaAposta });
  }
}

export default new ApostasController();

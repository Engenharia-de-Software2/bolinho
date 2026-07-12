import { v4 as uuidv4 } from "uuid";
import { db } from "../database.js";

function contarParticipantes(bolaoId) {
  return db.participantes.filter((p) => p.bolao_id === bolaoId).length;
}

function montarResumoBolao(bolao, usuarioId) {
  return {
    id: bolao.id,
    nome: bolao.nome,
    descricao: bolao.descricao || "",
    tipo: bolao.tipo || "geral",
    codigo_convite: bolao.codigo_convite,
    criador_id: bolao.criador_id,
    status: bolao.status,
    sou_criador: bolao.criador_id === usuarioId,
    total_participantes: contarParticipantes(bolao.id),
  };
}

class BoloesController {
  // POST /boloes
  async criar(req, res) {
    const { nome, tipo, descricao } = req.body;

    // validaDados
    if (!nome) {
      return res.status(400).json({ message: "O nome do bolão é obrigatório" });
    }

    // gerarCodigo()
    const codigo_convite = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    // new Bolao(...)
    const novoBolao = {
      id: uuidv4(),
      nome: nome.trim(),
      descricao: descricao ? descricao.trim() : "",
      tipo: tipo || "geral",
      codigo_convite,
      criador_id: req.usuario.id,
      status: "ativo",
    };

    // registrarBolao(bolao)
    db.boloes.push(novoBolao);

    // o criador do bolão já entra como participante
    db.participantes.push({ bolao_id: novoBolao.id, usuario_id: req.usuario.id });

    // 201 Created
    return res.status(201).json({ bolao: montarResumoBolao(novoBolao, req.usuario.id) });
  }

  // GET /boloes/meus
  async listarMeus(req, res) {
    const idsQueParticipo = db.participantes
      .filter((p) => p.usuario_id === req.usuario.id)
      .map((p) => p.bolao_id);

    const meusBoloes = db.boloes
      .filter((b) => idsQueParticipo.includes(b.id))
      .map((b) => montarResumoBolao(b, req.usuario.id));

    return res.status(200).json({ boloes: meusBoloes });
  }

  // GET /boloes/:id
  async detalhar(req, res) {
    const { id } = req.params;
    const bolao = db.boloes.find((b) => b.id === id);
    if (!bolao) {
      return res.status(404).json({ message: "Bolão não encontrado" });
    }

    const souParticipante = db.participantes.some(
      (p) => p.bolao_id === id && p.usuario_id === req.usuario.id,
    );
    if (!souParticipante) {
      return res.status(403).json({ message: "Você não participa deste bolão" });
    }

    const participantes = db.participantes
      .filter((p) => p.bolao_id === id)
      .map((p) => {
        const usuario = db.usuarios.find((u) => u.id === p.usuario_id);
        return {
          usuario_id: p.usuario_id,
          nome: usuario ? usuario.nome : "Usuário removido",
          eh_criador: p.usuario_id === bolao.criador_id,
        };
      });

    return res.status(200).json({
      bolao: montarResumoBolao(bolao, req.usuario.id),
      participantes,
    });
  }

  // POST /boloes/entrar  { codigo }
  async entrar(req, res) {
    const { codigo } = req.body;
    if (!codigo) {
      return res.status(400).json({ message: "Informe o código do convite" });
    }

    const bolao = db.boloes.find(
      (b) => b.codigo_convite === codigo.trim().toUpperCase(),
    );
    if (!bolao) {
      return res.status(404).json({ message: "Nenhum bolão encontrado com esse código" });
    }

    const jaParticipa = db.participantes.some(
      (p) => p.bolao_id === bolao.id && p.usuario_id === req.usuario.id,
    );
    if (jaParticipa) {
      return res.status(409).json({ message: "Você já participa deste bolão" });
    }

    db.participantes.push({ bolao_id: bolao.id, usuario_id: req.usuario.id });

    return res.status(200).json({ bolao: montarResumoBolao(bolao, req.usuario.id) });
  }

  // POST /boloes/:id/convidar  { email }
  async convidar(req, res) {
    const { id } = req.params;
    const { email } = req.body;

    const bolao = db.boloes.find((b) => b.id === id);
    if (!bolao) {
      return res.status(404).json({ message: "Bolão não encontrado" });
    }

    if (bolao.criador_id !== req.usuario.id) {
      return res
        .status(403)
        .json({ message: "Apenas o organizador pode convidar participantes" });
    }

    if (!email) {
      return res.status(400).json({ message: "Informe o e-mail do convidado" });
    }

    const convidado = db.usuarios.find(
      (u) => u.email === email.trim().toLowerCase(),
    );
    if (!convidado) {
      return res.status(404).json({
        message:
          "Usuário não encontrado. A pessoa precisa ter uma conta cadastrada.",
      });
    }

    const jaParticipa = db.participantes.some(
      (p) => p.bolao_id === bolao.id && p.usuario_id === convidado.id,
    );
    if (jaParticipa) {
      return res.status(409).json({ message: "Este usuário já participa do bolão" });
    }

    db.participantes.push({ bolao_id: bolao.id, usuario_id: convidado.id });

    db.notificacoes.push({
      id: uuidv4(),
      usuario_id: convidado.id,
      tipo: "CONVITE_BOLAO",
      titulo: "Você foi adicionado a um bolão",
      mensagem: `Você agora participa do bolão "${bolao.nome}".`,
      lida: false,
    });

    return res.status(200).json({ message: "Participante adicionado com sucesso" });
  }

  // DELETE /boloes/:id  -> exclui (se criador) ou sai (se participante)
  async excluir(req, res) {
    const { id } = req.params;

    // buscarBolao(id)
    const bolaoIndex = db.boloes.findIndex((b) => b.id === id);
    if (bolaoIndex === -1) {
      return res.status(404).json({ message: "Bolão não encontrado" });
    }

    const bolao = db.boloes[bolaoIndex];

    if (bolao.criador_id === req.usuario.id) {
      // alt [usuario é o criador] -> excluirBolao(bolao) e tudo relacionado
      db.boloes.splice(bolaoIndex, 1);
      db.participantes = db.participantes.filter((p) => p.bolao_id !== id);
      db.partidas = db.partidas.filter((p) => p.bolao_id !== id);
      db.apostas = db.apostas.filter((a) => a.bolao_id !== id);

      return res.status(200).json({ message: "Bolão excluído com sucesso" });
    }

    // usuário comum: apenas sai do bolão
    const eraParticipante = db.participantes.some(
      (p) => p.bolao_id === id && p.usuario_id === req.usuario.id,
    );
    if (!eraParticipante) {
      return res.status(403).json({ message: "Você não participa deste bolão" });
    }

    db.participantes = db.participantes.filter(
      (p) => !(p.bolao_id === id && p.usuario_id === req.usuario.id),
    );

    return res.status(200).json({ message: "Você saiu do bolão" });
  }

  // GET /boloes/:id/ranking
  async ranking(req, res) {
    const { id } = req.params;
    const bolao = db.boloes.find((b) => b.id === id);
    if (!bolao) {
      return res.status(404).json({ message: "Bolão não encontrado" });
    }

    const idsParticipantes = db.participantes
      .filter((p) => p.bolao_id === id)
      .map((p) => p.usuario_id);

    const ranking = idsParticipantes
      .map((usuarioId) => {
        const usuario = db.usuarios.find((u) => u.id === usuarioId);
        const apostasDoUsuario = db.apostas.filter(
          (a) => a.bolao_id === id && a.usuario_id === usuarioId,
        );
        const pontos = apostasDoUsuario.reduce(
          (soma, a) => soma + (a.pontos || 0),
          0,
        );
        return {
          usuario_id: usuarioId,
          nome: usuario ? usuario.nome : "Usuário",
          pontos,
          apostas_totais: apostasDoUsuario.length,
          apostas_certas: apostasDoUsuario.filter((a) => (a.pontos || 0) > 0)
            .length,
        };
      })
      .sort((a, b) => b.pontos - a.pontos);

    return res.status(200).json({ ranking });
  }
}

export default new BoloesController();

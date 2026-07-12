import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { db } from "../database.js";

const JWT_SECRET = "super-secret-key";

class AuthController {
  async register(req, res) {
    const { nome, email, senha } = req.body;

    // validaDados(nome, email, senha)
    if (!nome || !email || !senha) {
      return res.status(400).json({ message: "Dados inválidos" });
    }

    // hashPassword(senha) -> Simplificado para fins de exemplo
    const senhaHash = `hash_${senha}`;

    // new Usuario(...)
    const novoUsuario = {
      id: uuidv4(),
      nome,
      email,
      senha: senhaHash,
      role: "user",
      pontos_totais: 0,
    };

    // registrarUsuario(usuario)
    db.usuarios.push(novoUsuario);

    // generateToken(usuario)
    const token = jwt.sign({ id: novoUsuario.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // 201 Created
    return res
      .status(201)
      .json({ token, usuario: { id: novoUsuario.id, nome, email } });
  }

  async login(req, res) {
    const { email, senha } = req.body;

    // buscarUsuario(email)
    const usuario = db.usuarios.find((u) => u.email === email);
    if (!usuario) {
      return res.status(401).json({ message: "Usuário ou senha inválidos" });
    }

    // comparePassword(senha, hash)
    const senhaValida = usuario.senha === `hash_${senha}`;
    if (!senhaValida) {
      return res.status(401).json({ message: "Usuário ou senha inválidos" });
    }

    // generateToken(usuario)
    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "1h" });

    // 200 OK
    return res.status(200).json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  }

  async me(req, res) {
    // req.usuario é preenchido pelo authMiddleware
    const { id, nome, email, pontos_totais } = req.usuario;
    return res.status(200).json({ usuario: { id, nome, email, pontos_totais } });
  }
}

export default new AuthController();
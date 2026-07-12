import jwt from "jsonwebtoken";
import { db } from "./database.js";

const JWT_SECRET = "super-secret-key";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = db.usuarios.find((u) => u.id === decoded.id);
    if (!usuario) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.usuario && req.usuario.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Acesso negado: Requer Admin" });
  }
};

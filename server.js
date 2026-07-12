import express from "express";
import { authMiddleware } from "./authMiddleware.js";
import AuthController from "./controllers/AuthController.js";
import BoloesController from "./controllers/BoloesController.js";
import PartidasController from "./controllers/PartidasController.js";
import ApostasController from "./controllers/ApostasController.js";
import NotificacoesController from "./controllers/NotificacoesController.js";

const app = express();
app.use(express.json());

// CORS simples (sem depender de pacote externo) para permitir chamadas do
// app Expo Web, que roda em porta diferente da API.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// health check, útil para o app confirmar que a API está no ar
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// --------------------------- Autenticação ---------------------------------
app.post("/auth/register", AuthController.register);
app.post("/auth/login", AuthController.login);
app.get("/auth/me", authMiddleware, AuthController.me);

// ------------------------------- Bolões ------------------------------------
app.post("/boloes", authMiddleware, BoloesController.criar);
app.get("/boloes/meus", authMiddleware, BoloesController.listarMeus);
app.post("/boloes/entrar", authMiddleware, BoloesController.entrar);
app.get("/boloes/:id", authMiddleware, BoloesController.detalhar);
app.get("/boloes/:id/ranking", authMiddleware, BoloesController.ranking);
app.post("/boloes/:id/convidar", authMiddleware, BoloesController.convidar);
app.delete("/boloes/:id", authMiddleware, BoloesController.excluir);

// ------------------------------- Partidas -----------------------------------
app.post(
  "/boloes/:bolaoId/partidas",
  authMiddleware,
  PartidasController.criar,
);
app.get(
  "/boloes/:bolaoId/partidas",
  authMiddleware,
  PartidasController.listar,
);
app.put(
  "/partidas/:id/resultado",
  authMiddleware,
  PartidasController.atualizarResultado,
);

// ------------------------------- Apostas -------------------------------------
app.post(
  "/partidas/:id/apostas",
  authMiddleware,
  ApostasController.criarOuAtualizar,
);

// ---------------------------- Notificações -----------------------------------
app.get("/notificacoes", authMiddleware, NotificacoesController.listar);
app.put(
  "/notificacoes/lidas",
  authMiddleware,
  NotificacoesController.marcarTodasLidas,
);
app.put(
  "/notificacoes/:id/lida",
  authMiddleware,
  NotificacoesController.marcarLida,
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});

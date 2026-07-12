import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";

import estilos from "./src/styles/estilos";
import { CORES } from "./src/styles/cores";
import { AuthAPI, NotificacoesAPI, ApiError } from "./src/services/api";
import { salvarToken, obterToken, limparToken } from "./src/services/storage";
import { AvisosFlutuantes } from "./src/components/UI";

import LoginScreen from "./src/screens/LoginScreen";
import CadastroScreen from "./src/screens/CadastroScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import BolaoScreen from "./src/screens/BolaoScreen";
import NotificacoesScreen from "./src/screens/NotificacoesScreen";

/* =========================================================================
   BOLÃO — App (Expo / React Native)
   Front-end conectado ao backend Express (server.js) via src/services/api.js.
   Fluxo: Cadastro -> Login -> Dashboard -> Criar/Entrar em Bolão -> Palpites
   -> Definir Resultado -> Ranking -> Notificações
   ========================================================================= */

const gerarId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function App() {
  // --- SESSÃO ---
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [usuarioAtual, setUsuarioAtual] = useState(null);

  // --- NAVEGAÇÃO ---
  const [tela, setTela] = useState("login"); // login | cadastro | dashboard | bolao | notificacoes
  const [bolaoAtivoId, setBolaoAtivoId] = useState(null);

  // --- AVISOS (toasts) ---
  const [avisos, setAvisos] = useState([]);

  // --- BADGE DE NOTIFICAÇÕES ---
  const [naoLidas, setNaoLidas] = useState(0);

  const fecharAviso = (id) => {
    setAvisos((atual) => atual.filter((a) => a.id !== id));
  };

  const mostrarMensagem = (titulo, mensagem = "", tipo = "info") => {
    const id = gerarId();
    setAvisos((atual) => [{ id, titulo, mensagem, tipo }, ...atual].slice(0, 3));
    setTimeout(() => fecharAviso(id), 3600);
  };

  const confirmar = (titulo, mensagem, onConfirmar) => {
    if (typeof window !== "undefined" && window.confirm) {
      if (window.confirm(`${titulo}\n\n${mensagem}`)) onConfirmar();
      return;
    }
    // Em nativo sem window.confirm, executa direto (fallback simples).
    onConfirmar();
  };

  const atualizarContadorNotificacoes = async () => {
    try {
      const { notificacoes } = await NotificacoesAPI.listar();
      setNaoLidas(notificacoes.filter((n) => !n.lida).length);
    } catch (error) {
      // Se falhar, mantém o valor atual — não é crítico.
    }
  };

  // Ao abrir o app, tenta restaurar a sessão a partir do token salvo.
  useEffect(() => {
    (async () => {
      const token = await obterToken();
      if (!token) {
        setVerificandoSessao(false);
        return;
      }
      try {
        const { usuario } = await AuthAPI.me();
        setUsuarioAtual(usuario);
        setTela("dashboard");
        atualizarContadorNotificacoes();
      } catch (error) {
        await limparToken();
      } finally {
        setVerificandoSessao(false);
      }
    })();
  }, []);

  // ------------------------------ Ações de sessão ---------------------------

  const handleCadastrar = async (nome, email, senha) => {
    try {
      await AuthAPI.registrar(nome, email, senha);
      mostrarMensagem("Conta criada! 🎉", "Agora faça login para acessar sua conta.", "sucesso");
      setTela("login");
    } catch (error) {
      mostrarMensagem(
        "Não foi possível criar a conta",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    }
  };

  const handleLogin = async (email, senha) => {
    try {
      const { token, usuario } = await AuthAPI.login(email, senha);
      await salvarToken(token);
      setUsuarioAtual(usuario);
      setTela("dashboard");
      atualizarContadorNotificacoes();
    } catch (error) {
      mostrarMensagem(
        "Não foi possível entrar",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    }
  };

  const handleLogout = async () => {
    await limparToken();
    setUsuarioAtual(null);
    setBolaoAtivoId(null);
    setNaoLidas(0);
    setTela("login");
  };

  // ------------------------------ Navegação ---------------------------------

  const abrirBolao = (id) => {
    setBolaoAtivoId(id);
    setTela("bolao");
  };

  const voltarParaDashboard = () => {
    setBolaoAtivoId(null);
    setTela("dashboard");
  };

  if (verificandoSessao) {
    return (
      <View style={[estilos.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={CORES.campoEscuro} />
      </View>
    );
  }

  let conteudo;
  if (tela === "login") {
    conteudo = (
      <LoginScreen
        onEntrar={handleLogin}
        onIrParaCadastro={() => setTela("cadastro")}
        mostrarMensagem={mostrarMensagem}
      />
    );
  } else if (tela === "cadastro") {
    conteudo = (
      <CadastroScreen
        onCadastrar={handleCadastrar}
        onIrParaLogin={() => setTela("login")}
        mostrarMensagem={mostrarMensagem}
      />
    );
  } else if (tela === "bolao" && bolaoAtivoId) {
    conteudo = (
      <BolaoScreen
        bolaoId={bolaoAtivoId}
        usuarioAtual={usuarioAtual}
        onVoltar={voltarParaDashboard}
        mostrarMensagem={mostrarMensagem}
        confirmar={confirmar}
      />
    );
  } else if (tela === "notificacoes") {
    conteudo = (
      <NotificacoesScreen
        onVoltar={() => setTela("dashboard")}
        mostrarMensagem={mostrarMensagem}
        onContadorAtualizado={setNaoLidas}
      />
    );
  } else {
    conteudo = (
      <DashboardScreen
        usuarioAtual={usuarioAtual}
        naoLidas={naoLidas}
        onAbrirBolao={abrirBolao}
        onIrNotificacoes={() => setTela("notificacoes")}
        onLogout={handleLogout}
        mostrarMensagem={mostrarMensagem}
      />
    );
  }

  return (
    <View style={estilos.container}>
      <StatusBar style={tela === "login" || tela === "cadastro" ? "light" : "dark"} />
      {conteudo}
      <AvisosFlutuantes avisos={avisos} onFechar={fecharAviso} />
    </View>
  );
}

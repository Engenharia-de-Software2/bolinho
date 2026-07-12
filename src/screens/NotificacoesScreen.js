import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import estilos from "../styles/estilos";
import { CORES } from "../styles/cores";
import { NotificacoesAPI, ApiError } from "../services/api";
import { CabecalhoTopo, EstadoVazio } from "../components/UI";

export default function NotificacoesScreen({ onVoltar, mostrarMensagem, onContadorAtualizado }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    setCarregando(true);
    try {
      const { notificacoes: lista } = await NotificacoesAPI.listar();
      setNotificacoes(lista);
    } catch (error) {
      mostrarMensagem(
        "Não foi possível carregar as notificações",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const marcarTodasLidas = async () => {
    try {
      await NotificacoesAPI.marcarTodasLidas();
      setNotificacoes((atual) => atual.map((n) => ({ ...n, lida: true })));
      onContadorAtualizado?.(0);
    } catch (error) {
      mostrarMensagem(
        "Não foi possível atualizar",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    }
  };

  const marcarLida = async (id) => {
    try {
      await NotificacoesAPI.marcarLida(id);
      setNotificacoes((atual) => {
        const atualizadas = atual.map((n) => (n.id === id ? { ...n, lida: true } : n));
        onContadorAtualizado?.(atualizadas.filter((n) => !n.lida).length);
        return atualizadas;
      });
    } catch (error) {
      // silencioso: não é crítico se marcar como lida falhar
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CabecalhoTopo titulo="Notificações" onVoltar={onVoltar} />
      <ScrollView contentContainerStyle={estilos.conteudoScroll}>
        {carregando ? (
          <ActivityIndicator color={CORES.campoEscuro} style={{ marginTop: 20 }} />
        ) : notificacoes.length === 0 ? (
          <EstadoVazio emoji="🔕" texto="Nenhuma notificação por aqui ainda." />
        ) : (
          <>
            {naoLidas > 0 && (
              <TouchableOpacity onPress={marcarTodasLidas} style={{ alignSelf: "flex-end", marginBottom: 10 }}>
                <Text style={estilos.linkTextoForte}>Marcar todas como lidas</Text>
              </TouchableOpacity>
            )}
            {notificacoes.map((n) => (
              <TouchableOpacity
                key={n.id}
                activeOpacity={0.8}
                style={[estilos.cardNotificacao, !n.lida && estilos.cardNotificacaoNaoLida]}
                onPress={() => marcarLida(n.id)}
              >
                {!n.lida && <View style={estilos.pontoNaoLido} />}
                <View style={{ flex: 1 }}>
                  <Text style={estilos.notificacaoTitulo}>{n.titulo}</Text>
                  <Text style={estilos.notificacaoMensagem}>{n.mensagem}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

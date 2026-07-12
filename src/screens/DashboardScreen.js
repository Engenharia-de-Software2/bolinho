import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import estilos from "../styles/estilos";
import { CORES } from "../styles/cores";
import { BoloesAPI, ApiError } from "../services/api";
import {
  Botao,
  Campo,
  Selo,
  Avatar,
  CabecalhoTopo,
  EstadoVazio,
} from "../components/UI";

export default function DashboardScreen({
  usuarioAtual,
  naoLidas,
  onAbrirBolao,
  onIrNotificacoes,
  onLogout,
  mostrarMensagem,
}) {
  const [boloes, setBoloes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [mostrarCriarBolao, setMostrarCriarBolao] = useState(false);
  const [mostrarEntrarBolao, setMostrarEntrarBolao] = useState(false);
  const [nomeBolao, setNomeBolao] = useState("");
  const [codigoEntrar, setCodigoEntrar] = useState("");
  const [salvandoAcao, setSalvandoAcao] = useState(false);

  const carregarBoloes = useCallback(async () => {
    setCarregando(true);
    try {
      const { boloes: lista } = await BoloesAPI.listarMeus();
      setBoloes(lista);
    } catch (error) {
      mostrarMensagem(
        "Não foi possível carregar seus bolões",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    } finally {
      setCarregando(false);
    }
  }, [mostrarMensagem]);

  useEffect(() => {
    carregarBoloes();
  }, [carregarBoloes]);

  const handleCriarBolao = async () => {
    if (!nomeBolao.trim()) {
      return mostrarMensagem("Dê um nome", "Escolha um nome para o seu bolão.", "erro");
    }
    setSalvandoAcao(true);
    try {
      const { bolao } = await BoloesAPI.criar(nomeBolao.trim(), "geral", "");
      setNomeBolao("");
      setMostrarCriarBolao(false);
      await carregarBoloes();
      mostrarMensagem(
        "Bolão criado! 🏆",
        `Código de convite: ${bolao.codigo_convite}`,
        "sucesso",
      );
    } catch (error) {
      mostrarMensagem(
        "Não foi possível criar o bolão",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    } finally {
      setSalvandoAcao(false);
    }
  };

  const handleEntrarBolao = async () => {
    const codigo = codigoEntrar.trim().toUpperCase();
    if (!codigo) {
      return mostrarMensagem("Informe o código", "Digite o código de convite do bolão.", "erro");
    }
    setSalvandoAcao(true);
    try {
      const { bolao } = await BoloesAPI.entrar(codigo);
      setCodigoEntrar("");
      setMostrarEntrarBolao(false);
      await carregarBoloes();
      mostrarMensagem("Você entrou! 🙌", `Agora você faz parte de "${bolao.nome}".`, "sucesso");
    } catch (error) {
      mostrarMensagem(
        "Não foi possível entrar no bolão",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    } finally {
      setSalvandoAcao(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CabecalhoTopo
        titulo="Meus Bolões"
        subtitulo={`Olá, ${usuarioAtual?.nome?.split(" ")[0] || ""} 👋`}
        sino
        naoLidas={naoLidas}
        onSino={onIrNotificacoes}
      />
      <ScrollView contentContainerStyle={estilos.conteudoScroll}>
        <View style={estilos.cardResumo}>
          <Avatar nome={usuarioAtual?.nome} tamanho={54} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={estilos.resumoNome}>{usuarioAtual?.nome}</Text>
            <Text style={estilos.resumoEmail}>{usuarioAtual?.email}</Text>
          </View>
          <View style={estilos.resumoPontosBox}>
            <Text style={estilos.resumoPontosNumero}>
              {usuarioAtual?.pontos_totais ?? 0}
            </Text>
            <Text style={estilos.resumoPontosLabel}>pontos</Text>
          </View>
        </View>

        <View style={estilos.linhaBotoesAcao}>
          <Botao
            label="Criar bolão"
            icone="➕"
            tone="primary"
            small
            onPress={() => {
              setMostrarCriarBolao((v) => !v);
              setMostrarEntrarBolao(false);
            }}
          />
          <View style={{ width: 10 }} />
          <Botao
            label="Entrar com código"
            icone="🔑"
            tone="fantasma"
            small
            onPress={() => {
              setMostrarEntrarBolao((v) => !v);
              setMostrarCriarBolao(false);
            }}
          />
        </View>

        {mostrarCriarBolao && (
          <View style={estilos.cardFormInline}>
            <Campo
              label="Nome do novo bolão"
              icone="🏆"
              placeholder="Ex: Bolão da Copa"
              value={nomeBolao}
              onChangeText={setNomeBolao}
            />
            <Botao
              label="Confirmar criação"
              onPress={handleCriarBolao}
              tone="dourado"
              carregando={salvandoAcao}
            />
          </View>
        )}

        {mostrarEntrarBolao && (
          <View style={estilos.cardFormInline}>
            <Campo
              label="Código de convite"
              icone="🔑"
              placeholder="Ex: A1B2C3"
              value={codigoEntrar}
              onChangeText={(t) => setCodigoEntrar(t.toUpperCase())}
              autoCapitalize="characters"
            />
            <Botao label="Entrar no bolão" onPress={handleEntrarBolao} carregando={salvandoAcao} />
          </View>
        )}

        <Text style={estilos.secaoTitulo}>Seus bolões ({boloes.length})</Text>

        {carregando ? (
          <ActivityIndicator color={CORES.campoEscuro} style={{ marginTop: 20 }} />
        ) : boloes.length === 0 ? (
          <EstadoVazio
            emoji="🗒️"
            texto="Você ainda não participa de nenhum bolão. Crie um ou entre com um código!"
          />
        ) : (
          boloes.map((b) => (
            <TouchableOpacity
              key={b.id}
              activeOpacity={0.8}
              style={estilos.cardBolao}
              onPress={() => onAbrirBolao(b.id)}
            >
              <View style={estilos.cardBolaoFaixa} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={estilos.cardBolaoNome}>{b.nome}</Text>
                  {b.sou_criador && <Selo texto="organizador" tom="dourado" />}
                </View>
                <Text style={estilos.cardBolaoInfo}>
                  Código: <Text style={{ fontWeight: "700" }}>{b.codigo_convite}</Text>{" "}
                  · {b.total_participantes}{" "}
                  {b.total_participantes === 1 ? "participante" : "participantes"}
                </Text>
              </View>
              <Text style={estilos.cardBolaoSeta}>›</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 10 }} />
        <Botao label="Sair da conta" icone="🚪" tone="perigo" onPress={onLogout} />
      </ScrollView>
    </View>
  );
}

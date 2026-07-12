import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import estilos from "../styles/estilos";
import { CORES } from "../styles/cores";
import { BoloesAPI, PartidasAPI, ApostasAPI, ApiError } from "../services/api";
import {
  Botao,
  Campo,
  Selo,
  Avatar,
  CabecalhoTopo,
  EstadoVazio,
  emailValido,
} from "../components/UI";

export default function BolaoScreen({
  bolaoId,
  usuarioAtual,
  onVoltar,
  mostrarMensagem,
  confirmar,
}) {
  const [carregando, setCarregando] = useState(true);
  const [bolao, setBolao] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [subTela, setSubTela] = useState("partidas"); // partidas | ranking

  const [mostrarConvidar, setMostrarConvidar] = useState(false);
  const [emailConvidado, setEmailConvidado] = useState("");
  const [mostrarNovaPartida, setMostrarNovaPartida] = useState(false);
  const [novoTimeA, setNovoTimeA] = useState("");
  const [novoTimeB, setNovoTimeB] = useState("");
  const [novaDataHora, setNovaDataHora] = useState("");
  const [palpitesPlacar, setPalpitesPlacar] = useState({});
  const [resultadosOficiais, setResultadosOficiais] = useState({});
  const [partidaEditando, setPartidaEditando] = useState(null);
  const [salvandoAcao, setSalvandoAcao] = useState(false);

  const souCriador = bolao && usuarioAtual && bolao.criador_id === usuarioAtual.id;

  const carregarDetalhe = useCallback(async () => {
    try {
      const detalhe = await BoloesAPI.detalhar(bolaoId);
      setBolao(detalhe.bolao);
      setParticipantes(detalhe.participantes);
    } catch (error) {
      mostrarMensagem(
        "Não foi possível carregar o bolão",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    }
  }, [bolaoId, mostrarMensagem]);

  const carregarPartidas = useCallback(async () => {
    try {
      const { partidas: lista } = await PartidasAPI.listar(bolaoId);
      setPartidas(lista);
    } catch (error) {
      mostrarMensagem(
        "Não foi possível carregar as partidas",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    }
  }, [bolaoId, mostrarMensagem]);

  const carregarRanking = useCallback(async () => {
    try {
      const { ranking: lista } = await BoloesAPI.ranking(bolaoId);
      setRanking(lista);
    } catch (error) {
      mostrarMensagem(
        "Não foi possível carregar o ranking",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    }
  }, [bolaoId, mostrarMensagem]);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      await Promise.all([carregarDetalhe(), carregarPartidas(), carregarRanking()]);
      setCarregando(false);
    })();
  }, [carregarDetalhe, carregarPartidas, carregarRanking]);

  // ------------------------------ Ações -----------------------------------

  const handleCopiarCodigo = async () => {
    if (!bolao) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(bolao.codigo_convite);
      }
      mostrarMensagem("Código de convite", `Código: ${bolao.codigo_convite}`, "sucesso");
    } catch (error) {
      mostrarMensagem(
        "Não foi possível copiar",
        `Copie manualmente: ${bolao.codigo_convite}`,
        "alerta",
      );
    }
  };

  const handleConvidarPorEmail = async () => {
    const emailAlvo = emailConvidado.trim().toLowerCase();
    if (!emailAlvo) {
      return mostrarMensagem("Informe o e-mail", "Digite o e-mail do convidado.", "erro");
    }
    if (!emailValido(emailAlvo)) {
      return mostrarMensagem("E-mail inválido", "Digite um e-mail válido.", "erro");
    }

    setSalvandoAcao(true);
    try {
      await BoloesAPI.convidar(bolaoId, emailAlvo);
      setEmailConvidado("");
      setMostrarConvidar(false);
      await Promise.all([carregarDetalhe(), carregarRanking()]);
      mostrarMensagem("Convite aplicado", `${emailAlvo} foi adicionado ao bolão.`, "sucesso");
    } catch (error) {
      mostrarMensagem(
        "Não foi possível convidar",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    } finally {
      setSalvandoAcao(false);
    }
  };

  const handleCriarPartida = async () => {
    if (!novoTimeA.trim() || !novoTimeB.trim()) {
      return mostrarMensagem("Preencha os times", "Informe os dois times da partida.", "erro");
    }
    setSalvandoAcao(true);
    try {
      await PartidasAPI.criar(bolaoId, novoTimeA.trim(), novoTimeB.trim(), novaDataHora.trim());
      setNovoTimeA("");
      setNovoTimeB("");
      setNovaDataHora("");
      setMostrarNovaPartida(false);
      await carregarPartidas();
      mostrarMensagem("Partida adicionada", "A partida já aparece na lista do bolão.", "sucesso");
    } catch (error) {
      mostrarMensagem(
        "Não foi possível adicionar a partida",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    } finally {
      setSalvandoAcao(false);
    }
  };

  const handleSalvarPalpite = async (partidaId) => {
    const placarA = palpitesPlacar[`${partidaId}_a`];
    const placarB = palpitesPlacar[`${partidaId}_b`];
    if (placarA === undefined || placarB === undefined || placarA === "" || placarB === "") {
      return mostrarMensagem("Preencha o placar", "Informe o placar dos dois times antes de salvar.", "erro");
    }
    setSalvandoAcao(true);
    try {
      await ApostasAPI.salvar(partidaId, placarA, placarB);
      await carregarPartidas();
      mostrarMensagem("Palpite salvo ✅", "Boa sorte!", "sucesso");
    } catch (error) {
      mostrarMensagem(
        "Não foi possível salvar o palpite",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    } finally {
      setSalvandoAcao(false);
    }
  };

  const handleDefinirResultado = async (partidaId) => {
    const resA = resultadosOficiais[`${partidaId}_a`];
    const resB = resultadosOficiais[`${partidaId}_b`];
    if (resA === undefined || resB === undefined || resA === "" || resB === "") {
      return mostrarMensagem("Preencha o resultado", "Informe o placar final dos dois times.", "erro");
    }
    setSalvandoAcao(true);
    try {
      await PartidasAPI.atualizarResultado(partidaId, resA, resB);
      setPartidaEditando(null);
      await Promise.all([carregarPartidas(), carregarRanking()]);
      mostrarMensagem("Resultado registrado 🏁", "As pontuações foram recalculadas.", "sucesso");
    } catch (error) {
      mostrarMensagem(
        "Não foi possível registrar o resultado",
        error instanceof ApiError ? error.message : "Tente novamente.",
        "erro",
      );
    } finally {
      setSalvandoAcao(false);
    }
  };

  const handleSairOuExcluir = () => {
    if (!bolao) return;
    const acao = souCriador ? "excluir" : "sair";
    confirmar(
      souCriador ? "Excluir bolão" : "Sair do bolão",
      souCriador
        ? `Você é o organizador de "${bolao.nome}". Excluir removerá o bolão para todos os participantes. Deseja continuar?`
        : `Tem certeza que deseja sair de "${bolao.nome}"?`,
      async () => {
        try {
          await BoloesAPI.excluirOuSair(bolaoId);
          mostrarMensagem(
            souCriador ? "Bolão excluído" : "Você saiu do bolão",
            souCriador ? "O bolão foi removido para todos." : "O bolão foi removido da sua lista.",
            "sucesso",
          );
          onVoltar();
        } catch (error) {
          mostrarMensagem(
            `Não foi possível ${acao === "excluir" ? "excluir" : "sair d"}o bolão`,
            error instanceof ApiError ? error.message : "Tente novamente.",
            "erro",
          );
        }
      },
    );
  };

  if (carregando || !bolao) {
    return (
      <View style={{ flex: 1 }}>
        <CabecalhoTopo titulo="Bolão" onVoltar={onVoltar} />
        <ActivityIndicator color={CORES.campoEscuro} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CabecalhoTopo
        titulo={bolao.nome}
        subtitulo={`Código ${bolao.codigo_convite}`}
        onVoltar={onVoltar}
      />
      <View style={estilos.abas}>
        <TouchableOpacity
          style={[estilos.abaBotao, subTela === "partidas" && estilos.abaBotaoAtiva]}
          onPress={() => setSubTela("partidas")}
        >
          <Text style={[estilos.abaTexto, subTela === "partidas" && estilos.abaTextoAtivo]}>
            ⚽ Partidas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[estilos.abaBotao, subTela === "ranking" && estilos.abaBotaoAtiva]}
          onPress={() => setSubTela("ranking")}
        >
          <Text style={[estilos.abaTexto, subTela === "ranking" && estilos.abaTextoAtivo]}>
            🏆 Ranking
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={estilos.conteudoScroll}>
        <View style={estilos.cardFormInline}>
          <Text style={estilos.secaoTituloSemMargem}>Convites e participantes</Text>
          <Text style={estilos.cardBolaoInfo}>
            Compartilhe o código <Text style={{ fontWeight: "700" }}>{bolao.codigo_convite}</Text>
            {souCriador
              ? " ou adicione um usuário já cadastrado por e-mail."
              : " para chamar outras pessoas."}
          </Text>
          <View style={estilos.linhaBotoesAcao}>
            <Botao label="Copiar código" icone="📋" tone="fantasma" small onPress={handleCopiarCodigo} />
            {souCriador && (
              <>
                <View style={{ width: 10 }} />
                <Botao
                  label={mostrarConvidar ? "Cancelar" : "Convidar"}
                  icone={mostrarConvidar ? "✕" : "✉️"}
                  tone="primary"
                  small
                  onPress={() => setMostrarConvidar((v) => !v)}
                />
              </>
            )}
          </View>

          {mostrarConvidar && souCriador && (
            <View style={{ marginTop: 12 }}>
              <Campo
                label="E-mail do participante"
                icone="✉️"
                placeholder="amigo@email.com"
                value={emailConvidado}
                onChangeText={setEmailConvidado}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Botao
                label="Adicionar participante"
                tone="dourado"
                onPress={handleConvidarPorEmail}
                carregando={salvandoAcao}
              />
            </View>
          )}

          <View style={estilos.participantesLista}>
            {participantes.map((p) => (
              <View key={p.usuario_id} style={estilos.participanteChip}>
                <Text style={estilos.participanteChipTexto}>
                  {p.nome}
                  {p.eh_criador ? " · organizador" : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {subTela === "partidas" ? (
          <>
            {souCriador && (
              <>
                <Botao
                  label={mostrarNovaPartida ? "Cancelar" : "Adicionar partida"}
                  icone={mostrarNovaPartida ? "✕" : "➕"}
                  tone="fantasma"
                  small
                  onPress={() => setMostrarNovaPartida((v) => !v)}
                />
                {mostrarNovaPartida && (
                  <View style={[estilos.cardFormInline, { marginTop: 10 }]}>
                    <Campo
                      label="Time A"
                      icone="🏳️"
                      placeholder="Nome do time A"
                      value={novoTimeA}
                      onChangeText={setNovoTimeA}
                    />
                    <Campo
                      label="Time B"
                      icone="🏴"
                      placeholder="Nome do time B"
                      value={novoTimeB}
                      onChangeText={setNovoTimeB}
                    />
                    <Campo
                      label="Data / horário (opcional)"
                      icone="🗓️"
                      placeholder="Ex: Sáb · 16h00"
                      value={novaDataHora}
                      onChangeText={setNovaDataHora}
                    />
                    <Botao label="Adicionar" tone="dourado" onPress={handleCriarPartida} carregando={salvandoAcao} />
                  </View>
                )}
                <View style={{ height: 14 }} />
              </>
            )}

            {partidas.length === 0 && (
              <EstadoVazio
                emoji="⚽"
                texto={
                  souCriador
                    ? "Nenhuma partida cadastrada ainda. Adicione a primeira acima!"
                    : "O organizador ainda não cadastrou nenhuma partida neste bolão."
                }
              />
            )}

            {partidas.map((partida) => {
              const minhaAposta = partida.minha_aposta;
              const finalizada = partida.status === "finalizada";
              const editandoEssa = partidaEditando === partida.id;

              return (
                <View key={partida.id} style={estilos.cardPartida}>
                  <View style={estilos.cardPartidaTopo}>
                    <Text style={estilos.cardPartidaData}>{partida.data_hora}</Text>
                    <Selo texto={finalizada ? "encerrada" : "aberta"} tom={finalizada ? "sucesso" : "info"} />
                  </View>

                  <View style={estilos.timesLinha}>
                    <Text style={estilos.timeNome}>{partida.time_a}</Text>
                    {finalizada ? (
                      <Text style={estilos.placarFinal}>
                        {partida.resultado_a} x {partida.resultado_b}
                      </Text>
                    ) : (
                      <Text style={estilos.vsTexto}>vs</Text>
                    )}
                    <Text style={estilos.timeNome}>{partida.time_b}</Text>
                  </View>

                  {!finalizada && (
                    <View style={estilos.palpiteBloco}>
                      <Text style={estilos.rotuloCampo}>Seu palpite</Text>
                      <View style={estilos.placarContainer}>
                        <TextInput
                          style={estilos.inputPlacar}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#94A3B8"
                          value={
                            palpitesPlacar[`${partida.id}_a`] ??
                            (minhaAposta ? String(minhaAposta.placar_time_a) : "")
                          }
                          onChangeText={(text) =>
                            setPalpitesPlacar((p) => ({
                              ...p,
                              [`${partida.id}_a`]: text.replace(/[^0-9]/g, ""),
                            }))
                          }
                        />
                        <Text style={estilos.txtX}>×</Text>
                        <TextInput
                          style={estilos.inputPlacar}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#94A3B8"
                          value={
                            palpitesPlacar[`${partida.id}_b`] ??
                            (minhaAposta ? String(minhaAposta.placar_time_b) : "")
                          }
                          onChangeText={(text) =>
                            setPalpitesPlacar((p) => ({
                              ...p,
                              [`${partida.id}_b`]: text.replace(/[^0-9]/g, ""),
                            }))
                          }
                        />
                        <View style={{ flex: 1 }} />
                        <Botao
                          label={minhaAposta ? "Atualizar" : "Salvar"}
                          small
                          onPress={() => handleSalvarPalpite(partida.id)}
                          carregando={salvandoAcao}
                        />
                      </View>
                    </View>
                  )}

                  {finalizada && minhaAposta && (
                    <View style={estilos.faixaPontos}>
                      <Text style={estilos.faixaPontosTexto}>
                        Seu palpite: {minhaAposta.placar_time_a} x {minhaAposta.placar_time_b} ·{" "}
                        {minhaAposta.pontos > 0 ? `+${minhaAposta.pontos} pontos 🎯` : "0 pontos"}
                      </Text>
                    </View>
                  )}

                  {souCriador && !finalizada && (
                    <View style={estilos.organizadorBloco}>
                      {!editandoEssa ? (
                        <TouchableOpacity onPress={() => setPartidaEditando(partida.id)}>
                          <Text style={estilos.linkOrganizador}>⚙️ Registrar resultado oficial</Text>
                        </TouchableOpacity>
                      ) : (
                        <View>
                          <Text style={estilos.rotuloCampo}>Resultado final</Text>
                          <View style={estilos.placarContainer}>
                            <TextInput
                              style={estilos.inputPlacar}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor="#94A3B8"
                              value={resultadosOficiais[`${partida.id}_a`] ?? ""}
                              onChangeText={(text) =>
                                setResultadosOficiais((p) => ({
                                  ...p,
                                  [`${partida.id}_a`]: text.replace(/[^0-9]/g, ""),
                                }))
                              }
                            />
                            <Text style={estilos.txtX}>×</Text>
                            <TextInput
                              style={estilos.inputPlacar}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor="#94A3B8"
                              value={resultadosOficiais[`${partida.id}_b`] ?? ""}
                              onChangeText={(text) =>
                                setResultadosOficiais((p) => ({
                                  ...p,
                                  [`${partida.id}_b`]: text.replace(/[^0-9]/g, ""),
                                }))
                              }
                            />
                            <View style={{ flex: 1 }} />
                            <Botao
                              label="Confirmar"
                              tone="dourado"
                              small
                              onPress={() => handleDefinirResultado(partida.id)}
                              carregando={salvandoAcao}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            <View style={{ height: 6 }} />
            <Botao
              label={souCriador ? "Excluir bolão" : "Sair do bolão"}
              tone="perigo"
              onPress={handleSairOuExcluir}
            />
          </>
        ) : (
          <View style={estilos.cardRanking}>
            {ranking.length === 0 ? (
              <EstadoVazio emoji="📊" texto="Ainda não há palpites registrados neste bolão." />
            ) : (
              ranking.map((item, index) => (
                <View key={item.usuario_id} style={estilos.linhaRanking}>
                  <Text style={estilos.posicaoRanking}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                  </Text>
                  <Avatar nome={item.nome} tamanho={38} tom="escuro" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={estilos.nomeRanking}>
                      {item.nome} {item.usuario_id === usuarioAtual.id ? "(você)" : ""}
                    </Text>
                    <Text style={estilos.detalheRanking}>
                      {item.apostas_certas}/{item.apostas_totais} palpites certeiros
                    </Text>
                  </View>
                  <Text style={estilos.pontosRanking}>{item.pontos} pts</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

import React from "react";
import { Text, View, TextInput, TouchableOpacity } from "react-native";
import { CORES } from "../styles/cores";
import estilos from "../styles/estilos";

export const iniciais = (nome = "") =>
  nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const emailValido = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function Botao({ label, onPress, tone = "primary", disabled, small, icone, carregando }) {
  const tons = {
    primary: { bg: CORES.campoEscuro, txt: CORES.branco },
    dourado: { bg: CORES.dourado, txt: CORES.campoEscuro },
    perigo: { bg: CORES.perigo, txt: CORES.branco },
    fantasma: { bg: "transparent", txt: CORES.campoEscuro },
    claro: { bg: CORES.branco, txt: CORES.campoEscuro },
  };
  const t = tons[tone] || tons.primary;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || carregando}
      onPress={onPress}
      style={[
        estilos.botao,
        { backgroundColor: t.bg },
        tone === "fantasma" && {
          borderWidth: 1.5,
          borderColor: CORES.campoEscuro,
        },
        tone === "claro" && { borderWidth: 1, borderColor: CORES.borda },
        small && { height: 38, paddingHorizontal: 14 },
        (disabled || carregando) && { opacity: 0.5 },
      ]}
    >
      <Text
        style={[
          estilos.botaoTexto,
          { color: t.txt },
          small && { fontSize: 13 },
        ]}
      >
        {carregando ? "Aguarde..." : `${icone ? `${icone}  ` : ""}${label}`}
      </Text>
    </TouchableOpacity>
  );
}

export function Campo({ label, icone, ...props }) {
  return (
    <View style={{ width: "100%", marginBottom: 14 }}>
      {label ? <Text style={estilos.rotuloCampo}>{label}</Text> : null}
      <View style={estilos.campoWrapper}>
        {icone ? <Text style={estilos.campoIcone}>{icone}</Text> : null}
        <TextInput
          style={estilos.campoInput}
          placeholderTextColor="#94A3B8"
          {...props}
        />
      </View>
    </View>
  );
}

export function Selo({ texto, tom = "neutro" }) {
  const tons = {
    neutro: { bg: "#F1F5F9", txt: CORES.textoSuave },
    sucesso: { bg: CORES.sucessoBg, txt: CORES.sucesso },
    info: { bg: CORES.infoBg, txt: CORES.info },
    alerta: { bg: CORES.alertaBg, txt: CORES.alerta },
    dourado: { bg: "#FEF3C7", txt: "#92400E" },
  };
  const t = tons[tom] || tons.neutro;
  return (
    <View style={[estilos.selo, { backgroundColor: t.bg }]}>
      <Text style={[estilos.seloTexto, { color: t.txt }]}>{texto}</Text>
    </View>
  );
}

export function Avatar({ nome, tamanho = 46, tom = "dourado" }) {
  const fundo = tom === "dourado" ? CORES.dourado : CORES.campoEscuro2;
  const cor = tom === "dourado" ? CORES.campoEscuro : CORES.branco;
  return (
    <View
      style={[
        estilos.avatar,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: fundo,
        },
      ]}
    >
      <Text
        style={[estilos.avatarTexto, { color: cor, fontSize: tamanho * 0.38 }]}
      >
        {iniciais(nome)}
      </Text>
    </View>
  );
}

export function CabecalhoTopo({ titulo, subtitulo, onVoltar, sino, naoLidas, onSino }) {
  return (
    <View style={estilos.topo}>
      <View style={estilos.topoDecoracaoA} />
      <View style={estilos.topoDecoracaoB} />
      <View style={estilos.topoLinha}>
        {onVoltar ? (
          <TouchableOpacity
            onPress={onVoltar}
            style={estilos.topoBotaoIcone}
            activeOpacity={0.7}
          >
            <Text style={estilos.topoBotaoIconeTexto}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={estilos.topoBotaoIcone} />
        )}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={estilos.topoTitulo}>{titulo}</Text>
          {subtitulo ? (
            <Text style={estilos.topoSubtitulo}>{subtitulo}</Text>
          ) : null}
        </View>
        {sino ? (
          <TouchableOpacity
            onPress={onSino}
            style={estilos.topoBotaoIcone}
            activeOpacity={0.7}
          >
            <Text style={estilos.topoBotaoIconeTexto}>🔔</Text>
            {naoLidas > 0 && (
              <View style={estilos.topoBadge}>
                <Text style={estilos.topoBadgeTexto}>
                  {naoLidas > 9 ? "9+" : naoLidas}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={estilos.topoBotaoIcone} />
        )}
      </View>
    </View>
  );
}

export function EstadoVazio({ emoji, texto }) {
  return (
    <View style={estilos.vazioContainer}>
      <Text style={{ fontSize: 34, marginBottom: 6 }}>{emoji}</Text>
      <Text style={estilos.vazioTexto}>{texto}</Text>
    </View>
  );
}

export function AvisosFlutuantes({ avisos, onFechar }) {
  if (!avisos.length) return null;

  return (
    <View style={estilos.avisosContainer} pointerEvents="box-none">
      {avisos.map((aviso) => (
        <TouchableOpacity
          key={aviso.id}
          activeOpacity={0.9}
          onPress={() => onFechar(aviso.id)}
          style={[
            estilos.avisoCard,
            aviso.tipo === "erro" && estilos.avisoErro,
            aviso.tipo === "sucesso" && estilos.avisoSucesso,
            aviso.tipo === "alerta" && estilos.avisoAlerta,
          ]}
        >
          <Text style={estilos.avisoTitulo}>{aviso.titulo}</Text>
          {!!aviso.mensagem && (
            <Text style={estilos.avisoMensagem}>{aviso.mensagem}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

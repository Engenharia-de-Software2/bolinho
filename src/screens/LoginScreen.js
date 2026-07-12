import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import estilos from "../styles/estilos";
import { Botao, Campo } from "../components/UI";

export default function LoginScreen({ onEntrar, onIrParaCadastro, mostrarMensagem }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      return mostrarMensagem("Campos obrigatórios", "Informe e-mail e senha.", "erro");
    }
    setCarregando(true);
    try {
      await onEntrar(email.trim().toLowerCase(), senha);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.telaAuthScroll}>
      <View style={estilos.heroAuth}>
        <View style={estilos.heroDecoracaoA} />
        <View style={estilos.heroDecoracaoB} />
        <View style={estilos.heroBolaWrap}>
          <Text style={estilos.heroBola}>⚽</Text>
        </View>
        <Text style={estilos.heroTitulo}>Bolão</Text>
        <Text style={estilos.heroSubtitulo}>
          Crie seu bolão, palpite e dispute o topo do ranking
        </Text>
      </View>

      <View style={estilos.cardAuth}>
        <Text style={estilos.tituloCard}>Acessar conta</Text>
        <Campo
          label="E-mail"
          icone="✉️"
          placeholder="voce@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Campo
          label="Senha"
          icone="🔒"
          placeholder="Sua senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
        <Botao label="Entrar" onPress={handleLogin} carregando={carregando} />
        <TouchableOpacity onPress={onIrParaCadastro} style={{ marginTop: 16 }}>
          <Text style={estilos.linkTexto}>
            Não tem conta?{" "}
            <Text style={estilos.linkTextoForte}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

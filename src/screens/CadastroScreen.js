import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import estilos from "../styles/estilos";
import { Botao, Campo, emailValido } from "../components/UI";

export default function CadastroScreen({ onCadastrar, onIrParaLogin, mostrarMensagem }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleCadastro = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      return mostrarMensagem(
        "Campos obrigatórios",
        "Preencha nome, e-mail e senha para continuar.",
        "erro",
      );
    }
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailValido(emailNormalizado)) {
      return mostrarMensagem(
        "E-mail inválido",
        "Digite um e-mail em um formato válido, como nome@email.com.",
        "erro",
      );
    }

    setCarregando(true);
    try {
      await onCadastrar(nome.trim(), emailNormalizado, senha);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.telaAuthScroll}>
      <View style={[estilos.heroAuth, { paddingTop: 50, paddingBottom: 34 }]}>
        <View style={estilos.heroDecoracaoA} />
        <View style={estilos.heroDecoracaoB} />
        <Text style={estilos.heroTitulo}>Criar conta</Text>
        <Text style={estilos.heroSubtitulo}>Leva menos de um minuto ⏱️</Text>
      </View>

      <View style={estilos.cardAuth}>
        <Campo
          label="Nome completo"
          icone="👤"
          placeholder="Como podemos te chamar?"
          value={nome}
          onChangeText={setNome}
        />
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
          placeholder="Crie uma senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
        <Botao
          label="Criar conta"
          onPress={handleCadastro}
          tone="dourado"
          carregando={carregando}
        />
        <TouchableOpacity onPress={onIrParaLogin} style={{ marginTop: 16 }}>
          <Text style={estilos.linkTexto}>
            Já tem conta? <Text style={estilos.linkTextoForte}>Faça login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

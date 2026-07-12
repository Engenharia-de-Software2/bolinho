import { Platform } from "react-native";

/**
 * Armazenamento simples do token de sessão.
 *
 * No Web usamos localStorage (sobrevive a recarregar a página).
 * Em Android/iOS, como o projeto não tem uma dependência de armazenamento
 * persistente instalada (ex: @react-native-async-storage/async-storage),
 * guardamos em memória: a sessão dura enquanto o app estiver aberto e se
 * perde ao fechar o app. Para persistir entre aberturas em nativo, instale
 * o pacote acima e troque a implementação abaixo.
 */

const CHAVE = "bolao-app-token";
let tokenEmMemoria = null;

function temLocalStorage() {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    !!window.localStorage
  );
}

export async function salvarToken(token) {
  tokenEmMemoria = token;
  if (temLocalStorage()) {
    try {
      window.localStorage.setItem(CHAVE, token);
    } catch (error) {
      console.warn("Não foi possível salvar o token", error);
    }
  }
}

export async function obterToken() {
  if (temLocalStorage()) {
    try {
      return window.localStorage.getItem(CHAVE);
    } catch (error) {
      return tokenEmMemoria;
    }
  }
  return tokenEmMemoria;
}

export async function limparToken() {
  tokenEmMemoria = null;
  if (temLocalStorage()) {
    try {
      window.localStorage.removeItem(CHAVE);
    } catch (error) {
      // ignora
    }
  }
}

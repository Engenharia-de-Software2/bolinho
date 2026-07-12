import { Platform } from "react-native";

/**
 * Endereço base da API (backend Express em server.js, porta 3000).
 *
 * - Web (expo start --web): o navegador consegue acessar localhost normalmente.
 * - Android emulador: localhost do computador é 10.0.2.2 dentro do emulador.
 * - iOS simulador: localhost funciona igual ao navegador.
 * - Dispositivo físico: troque por http://SEU_IP_NA_REDE:3000
 *
 * Ajuste API_URL se testar em outro ambiente.
 */
function resolverApiUrl() {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
}

export const API_URL = resolverApiUrl();

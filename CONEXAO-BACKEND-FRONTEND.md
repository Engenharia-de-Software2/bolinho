# Conexão Backend ↔ Frontend + Telas por funcionalidade

Este documento descreve o que foi feito para ligar de verdade o backend
Express (`server.js`) ao frontend Expo/React Native (`App.js`), que antes
rodavam desconectados (ver `ANALISE-E-CORRECOES.md`).

## O que mudou

### 1. Backend (Express) — completado

O backend só tinha 3 rotas (registro, login, criar/excluir bolão, resultado
de partida) e nenhuma delas cobria o app inteiro. Foram adicionadas todas as
rotas que faltavam:

| Método | Rota                          | Função                                             |
|--------|-------------------------------|-----------------------------------------------------|
| POST   | `/auth/register`              | Cadastro de usuário                                 |
| POST   | `/auth/login`                 | Login (retorna token JWT)                           |
| GET    | `/auth/me`                    | Restaura a sessão a partir do token                 |
| POST   | `/boloes`                     | Criar bolão (criador já entra como participante)    |
| GET    | `/boloes/meus`                | Listar os bolões em que o usuário participa         |
| GET    | `/boloes/:id`                 | Detalhe do bolão + lista de participantes           |
| POST   | `/boloes/entrar`              | Entrar em um bolão por código de convite            |
| POST   | `/boloes/:id/convidar`        | Organizador adiciona alguém pelo e-mail              |
| DELETE | `/boloes/:id`                 | Excluir (se organizador) ou sair (se participante)  |
| GET    | `/boloes/:id/ranking`         | Ranking do bolão                                    |
| POST   | `/boloes/:bolaoId/partidas`   | Organizador cadastra uma partida                    |
| GET    | `/boloes/:bolaoId/partidas`   | Lista partidas do bolão (com o palpite do usuário)  |
| PUT    | `/partidas/:id/resultado`     | Organizador define o resultado oficial e pontua     |
| POST   | `/partidas/:id/apostas`       | Usuário salva/atualiza seu palpite                  |
| GET    | `/notificacoes`               | Lista notificações do usuário logado                |
| PUT    | `/notificacoes/:id/lida`      | Marca uma notificação como lida                     |
| PUT    | `/notificacoes/lidas`         | Marca todas como lidas                              |

Também foram criados os controllers que faltavam:
`controllers/ApostasController.js` e `controllers/NotificacoesController.js`.
`database.js` ganhou o array `participantes`, e as notificações agora têm
`usuario_id` (antes eram globais para todo mundo).

O backend continua em memória (sem banco de dados real) — isso é
suficiente para desenvolvimento/demonstração, mas os dados se perdem ao
reiniciar o servidor.

### 2. Frontend — camada de API

Criada em `src/services/`:

- **`api.js`** — todas as chamadas HTTP para o backend, organizadas por
  domínio (`AuthAPI`, `BoloesAPI`, `PartidasAPI`, `ApostasAPI`,
  `NotificacoesAPI`), com tratamento de erro (`ApiError`) para exibir a
  mensagem certa nas telas.
- **`storage.js`** — guarda o token de sessão. No Web usa `localStorage`
  (sobrevive a recarregar a página). Em nativo (Android/iOS) fica em
  memória, pois o projeto não tem uma dependência de storage persistente
  instalada — para persistir entre aberturas do app nativo, instale
  `@react-native-async-storage/async-storage` e troque a implementação.

`src/config.js` define a URL da API (`http://localhost:3000` na Web/iOS,
`http://10.0.2.2:3000` no emulador Android). Ajuste conforme seu ambiente.

### 3. Frontend — telas separadas por funcionalidade

O `App.js` tinha quase 2000 linhas com tudo dentro de um único componente.
Agora ele só orquestra sessão e navegação; cada funcionalidade tem sua
própria tela em `src/screens/`:

- `LoginScreen.js` — login
- `CadastroScreen.js` — criação de conta
- `DashboardScreen.js` — "Meus Bolões": criar bolão, entrar por código, listar
- `BolaoScreen.js` — participantes, convite por e-mail, partidas, palpites,
  resultado oficial (organizador), ranking
- `NotificacoesScreen.js` — lista e marcação de lidas

Componentes visuais reutilizáveis (botão, campo, avatar, selo, cabeçalho,
avisos flutuantes) ficaram em `src/components/UI.js`, e os estilos/paleta em
`src/styles/`.

## Como rodar

Abra dois terminais:

```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — frontend (Web é o mais simples para testar)
npm run web
```

O backend sobe em `http://localhost:3000`. Se estiver testando no Android
emulado, o app já aponta para `10.0.2.2:3000` automaticamente. Em dispositivo
físico, edite `src/config.js` e coloque o IP da sua máquina na rede local.

## Fluxo de teste sugerido

1. Criar conta A → fazer login.
2. Criar um bolão → copiar o código.
3. Adicionar uma partida.
4. Sair, criar conta B → fazer login → entrar no bolão pelo código.
5. Registrar um palpite com a conta B.
6. Voltar para a conta A → definir o resultado oficial da partida.
7. Conferir: pontuação calculada, ranking atualizado, notificação recebida
   pela conta B.
8. Testar convite por e-mail (conta A convida o e-mail da conta B).

## Limitações que continuam existindo

- Sem banco de dados real: os dados vivem em memória no processo do
  `server.js` e somem ao reiniciar o backend.
- Convite por e-mail não envia e-mail de verdade — apenas adiciona ao
  bolão um usuário que já tem conta cadastrada no mesmo backend.
- Sessão em apps nativos (Android/iOS) não persiste entre reaberturas do
  app, só na Web (ver nota sobre `storage.js` acima).

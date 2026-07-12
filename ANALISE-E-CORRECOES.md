# Análise e correções do projeto Bolão

## Diagnóstico rápido

O projeto novo (`bolao`) não é uma continuação técnica direta do projeto antigo (`bolinho-main`).

- O antigo é um app web simples em HTML, CSS e JavaScript, separado em `views`, `controllers`, `state` e `database`.
- O novo é um app Expo/React Native quase todo concentrado em `App.js`.
- O novo também tem um backend Express (`server.js`, `controllers`, `database.js`), mas o `App.js` não chama esse backend em nenhum momento. Não existe `fetch`, `axios` ou camada de API conectando frontend e backend.

Por isso, vários fluxos parecem “falsos” ou incompletos: o app visualmente existe, mas os dados ficam apenas em memória local.

## Principais problemas encontrados

1. **Login/cadastro sem persistência real**
   - Antes da correção, usuários cadastrados ficavam só em `useState`.
   - Ao recarregar a página/app, tudo sumia.
   - Isso dá a impressão de que login não funciona.

2. **Alertas ruins no Expo Web**
   - O código usava `Alert.alert` do React Native.
   - No Web, isso pode não aparecer do jeito esperado.
   - Foi criado um sistema próprio de avisos/toasts dentro do app.

3. **Convite de pessoas incompleto**
   - O app só tinha entrada por código.
   - Não havia fluxo de convite por e-mail nem lista clara de participantes dentro do bolão.
   - Foi adicionado convite por e-mail para usuários já cadastrados no protótipo.

4. **Partidas eram globais**
   - Antes, toda partida criada aparecia em todos os bolões.
   - Agora cada partida recebe `bolao_id` e aparece apenas no bolão correto.

5. **Pontuação do painel podia ficar desatualizada**
   - O card do dashboard mostrava `usuarioLogado.pontos_totais`, mas esse objeto não atualizava quando o estado de usuários mudava.
   - Agora o total exibido é calculado pelas apostas finalizadas.

6. **Backend existe, mas está desconectado**
   - O backend ainda é apenas um esqueleto em memória.
   - Para um trabalho mais completo, o próximo passo correto é ligar o `App.js` ao `server.js` ou voltar para a arquitetura web antiga e evoluir em cima dela.

## O que foi alterado no App.js

- Adicionado sistema de avisos flutuantes.
- Adicionada persistência simples no navegador com `localStorage`.
- Adicionado botão para copiar código do bolão.
- Adicionado convite por e-mail para usuários já cadastrados.
- Adicionada lista de participantes dentro do bolão.
- Corrigido vínculo de partidas por bolão.
- Corrigido cálculo de pontos exibido no dashboard.
- Melhorada validação de e-mail no cadastro.
- Substituídos vários `Alert.alert` simples por mensagens internas.

## Como testar

1. Instale as dependências, se necessário:

```bash
npm install
```

2. Rode o app:

```bash
npm start
```

3. Teste o fluxo:

- Criar conta A.
- Fazer login com conta A.
- Criar um bolão.
- Copiar o código.
- Sair.
- Criar conta B.
- Fazer login com conta B.
- Entrar no bolão pelo código.
- Voltar na conta A e testar convite por e-mail usando o e-mail da conta B.

## Limitação importante

O convite por e-mail nesta versão **não envia e-mail real**. Ele adiciona ao bolão um usuário que já existe no protótipo local. Para envio real de e-mail, seria necessário backend com serviço de e-mail, banco persistente e rota de convite.

# Instalação do Conexa MCP

Guia completo de instalação e validação. A versão curta está no [README](README.md); a página do projeto explica o sistema visualmente: <https://expert-integrado.github.io/conexa-mcp/>.

Ao final você terá o servidor `conexa-mcp` registrado no seu cliente de IA com duas informações suas: o **subdomínio** do seu Conexa e um **Token de Aplicação**.

## Pré-requisitos

| Item | Como conferir |
|---|---|
| Node.js 18 ou superior | `node --version` — se faltar, instale por <https://nodejs.org> |
| Um cliente MCP | Claude Code (terminal) ou Claude Desktop |
| Acesso de administrador ao Conexa | Necessário para criar o Token de Aplicação |

## Rota recomendada — instalação assistida pelo Claude

Copie o bloco abaixo e cole em uma conversa com o Claude. Ele verifica os pré-requisitos, **oferece pilotar o navegador** na etapa do token (você faz o login; a senha nunca passa pelo chat) e só declara pronto depois de **validar a conexão de verdade**.

```text
Quero instalar o servidor MCP do Conexa (https://github.com/Expert-Integrado/conexa-mcp) nesta máquina. Conduza o processo do início ao fim, nesta ordem, sem pular a validação final:

1. PRÉ-REQUISITOS — verifique com comandos reais: rode "node --version" (precisa ser 18 ou superior). Se o Node.js não estiver instalado, me oriente a instalar pelo site https://nodejs.org e só continue depois de confirmar. Identifique também qual cliente estou usando (Claude Code, Claude Desktop ou outro cliente MCP).

2. SUBDOMÍNIO — me pergunte o subdomínio do meu Conexa: é a primeira parte do endereço que uso para acessar o sistema (se acesso "minhaempresa.conexa.app", o subdomínio é "minhaempresa"). Não continue sem essa resposta.

3. TOKEN DE APLICAÇÃO (etapa de navegador) — o token é criado dentro do Conexa, no menu Config > Integrações > API / Token, por um usuário administrador. Antes de executar, pergunte com a ferramenta AskUserQuestion (botões; se o cliente não tiver botões, pergunte em texto): "Essa etapa é no navegador. Quer que eu faça para você?" com estas opções:
   - "Sim, pilote o navegador" (opção padrão): use o Playwright MCP; se ele não estiver instalado, instale antes com "claude mcp add playwright -- npx -y @playwright/mcp@latest" e me avise caso precise reiniciar a sessão. Abra https://SUBDOMINIO.conexa.app, PARE na tela de login e peça para eu fazer o login sozinho — NUNCA peça minha senha no chat. Depois que eu confirmar que entrei, navegue até Config > Integrações > API / Token e me ajude a gerar e copiar o Token de Aplicação.
   - "Usar o Claude in Chrome": mesmo roteiro, pilotando o meu Chrome (que já tem minha sessão logada).
   - "Prefiro fazer manualmente": me passe o passo a passo — acessar https://SUBDOMINIO.conexa.app com usuário administrador, abrir Config > Integrações > API / Token, gerar o token e colar aqui UMA única vez, só para ele ir direto para o arquivo de configuração local.

4. REGISTRO DO MCP — configure o servidor com as variáveis de ambiente corretas:
   - Claude Code: claude mcp add conexa --scope user --env CONEXA_SUBDOMAIN=<subdominio> --env CONEXA_TOKEN=<token> -- npx -y conexa-mcp
   - Claude Desktop: adicione ao claude_desktop_config.json (menu Configurações > Desenvolvedor > Editar configuração) o servidor "conexa" com command "npx", args ["-y", "conexa-mcp"] e as variáveis CONEXA_SUBDOMAIN e CONEXA_TOKEN.
   - Outro cliente MCP: configuração equivalente (command: npx -y conexa-mcp + as duas variáveis).

5. SEGURANÇA — o token vive SOMENTE no arquivo de configuração local do MCP (ou em um .env local). Não repita o token na conversa depois de salvo, não grave em outros arquivos e nunca envie para a internet ou para um repositório.

6. VALIDAÇÃO REAL — peça para eu reiniciar o cliente (fechar e abrir) e então chame a ferramenta test_connection do servidor conexa. Só considere a credencial válida se a resposta confirmar que a conexão está funcionando. Se der erro, leia a mensagem (token errado, subdomínio errado e token expirado são as causas mais comuns) e me ajude a corrigir antes de seguir.

7. TESTE FINAL E RESUMO — faça uma chamada de leitura de verdade (por exemplo, list_companies com limit 1), me mostre o resultado e termine com um resumo: o que foi instalado, onde o token ficou salvo e 3 exemplos de pedidos que eu já posso fazer.
```

## Rota manual

### 1. Obtenha o Token de Aplicação (única etapa de navegador)

1. Acesse `https://SEUSUBDOMINIO.conexa.app` com um usuário **administrador**.
2. Abra o menu **Config > Integrações > API / Token**.
3. Gere (ou copie) o **Token de Aplicação**.
4. Guarde o token só até o passo seguinte — ele vai viver apenas no arquivo de configuração local.

### 2. Registre no Claude Code

```bash
claude mcp add conexa --scope user \
  --env CONEXA_SUBDOMAIN=minhaempresa \
  --env CONEXA_TOKEN=seu_token_aqui \
  -- npx -y conexa-mcp
```

### 3. Registre no Claude Desktop

Edite o `claude_desktop_config.json` (menu **Configurações > Desenvolvedor > Editar configuração**) e adicione dentro de `mcpServers`:

```json
{
  "mcpServers": {
    "conexa": {
      "command": "npx",
      "args": ["-y", "conexa-mcp"],
      "env": {
        "CONEXA_SUBDOMAIN": "minhaempresa",
        "CONEXA_TOKEN": "seu_token_aqui"
      }
    }
  }
}
```

Depois feche e abra o Claude Desktop.

### 4. Outros clientes MCP / código-fonte

Qualquer cliente MCP: `command: npx`, `args: ["-y", "conexa-mcp"]` e as duas variáveis de ambiente.

Para rodar do código-fonte:

```bash
git clone https://github.com/Expert-Integrado/conexa-mcp.git
cd conexa-mcp
npm install
npm run build
```

E aponte o cliente para `node <caminho>/conexa-mcp/dist/index.js` com as mesmas variáveis.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `CONEXA_SUBDOMAIN` | Sim* | Subdomínio do seu Conexa (`minhaempresa` de `minhaempresa.conexa.app`) |
| `CONEXA_TOKEN` | Sim** | Token de Aplicação (recomendado) — criado em **Config > Integrações > API / Token** |
| `CONEXA_USERNAME` / `CONEXA_PASSWORD` | Alternativa** | Login e senha de um usuário admin/funcionário; o servidor autentica e renova a sessão sozinho |
| `CONEXA_BASE_URL` | Alternativa* | URL completa da API, caso o ambiente não siga o padrão `https://X.conexa.app/index.php/api/v2` |

\* Informe `CONEXA_SUBDOMAIN` **ou** `CONEXA_BASE_URL` · \*\* Informe `CONEXA_TOKEN` **ou** usuário e senha.

## Validação (não pule)

1. Reinicie o cliente de IA (fechar e abrir).
2. Peça ao Claude: *"chame a ferramenta test_connection do servidor conexa"*. A resposta de sucesso confirma a autenticação e mostra a primeira unidade da sua conta.
3. Faça uma leitura real de ponta a ponta, por exemplo: *"liste as unidades"* (`list_companies`) ou *"liste 5 clientes"* (`list_customers`).

Só considere a instalação concluída com os dois passos acima funcionando.

## Segurança

- O token fica **somente** no arquivo de configuração local do cliente MCP (ou em um `.env` local — já ignorado pelo `.gitignore`).
- O token é enviado exclusivamente para o seu próprio Conexa (`https://SEUSUBDOMINIO.conexa.app`).
- Não repita o token em conversas depois de salvo, não o grave em outros arquivos e nunca o envie para repositórios.
- Ferramentas destrutivas (`delete_*`, `end_*`, `cancel_*`) são marcadas no protocolo — o Claude pede confirmação antes de executá-las.

## Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `Configuração ausente: defina CONEXA_SUBDOMAIN...` | As variáveis de ambiente não chegaram ao servidor | Confira a entrada do servidor no arquivo de configuração do cliente e reinicie o cliente |
| `Erro 401 da API Conexa` | Token errado, expirado ou revogado | Gere um token novo em **Config > Integrações > API / Token** e atualize a configuração |
| Erro de rede / host não encontrado | Subdomínio digitado errado | Confira o endereço que você usa no navegador: o subdomínio é a parte antes de `.conexa.app` |
| `Erro 429 da API Conexa` | Limite oficial de 60 requisições/minuto | Nada — o servidor espera o tempo indicado e tenta de novo sozinho |
| `node --version` menor que 18 | Node.js antigo | Atualize pelo <https://nodejs.org> |
| As ferramentas `conexa` não aparecem no cliente | Cliente não recarregou a configuração | Feche e abra o cliente; no Claude Code, confira com `claude mcp list` |

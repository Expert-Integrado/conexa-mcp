# CLAUDE.md — conexa-mcp

Servidor MCP para a API v2 do Conexa (conexa.app). Página do projeto: <https://expert-integrado.github.io/conexa-mcp/> · Guia de instalação: [INSTALL.md](INSTALL.md).

## Onboarding assistido (instruções para o Claude)

Se o usuário abriu este repositório (ou pediu ajuda com o Conexa MCP) e o servidor **ainda não está configurado** — sem `CONEXA_SUBDOMAIN`/`CONEXA_TOKEN` no cliente MCP e a tool `test_connection` indisponível ou falhando — **ofereça ativamente o setup guiado**. Não espere o usuário pedir.

### Protocolo (nesta ordem)

1. **Pré-requisitos primeiro.** Verifique com comandos reais: `node --version` (precisa ser >= 18). Sem Node.js, oriente a instalação por <https://nodejs.org> e só continue depois de confirmar. Identifique o cliente em uso (Claude Code, Claude Desktop ou outro).
2. **Subdomínio.** Pergunte o subdomínio do Conexa do usuário (de `minhaempresa.conexa.app`, o subdomínio é `minhaempresa`). Não prossiga sem ele.
3. **Toda etapa de navegador pergunta antes.** Use `AskUserQuestion` (botões; sem suporte a botões, pergunte em texto): *"Essa etapa é no navegador. Quer que eu faça para você?"* com três opções:
   - **Pilotar com Playwright MCP (padrão).** Se o Playwright MCP não estiver disponível, instale antes: `claude mcp add playwright -- npx -y @playwright/mcp@latest` (avise que pode ser preciso reiniciar a sessão).
   - **Claude in Chrome (alternativa).** Mesmo roteiro, no Chrome do usuário, que já tem a sessão logada.
   - **Manual.** Entregue o passo a passo completo e acompanhe.
4. **Login é sempre do usuário.** Ao pilotar o navegador, abra a URL, **pare na tela de login** e devolva o controle para o usuário entrar sozinho. **NUNCA peça senha no chat.** Continue só depois que ele confirmar que entrou.
5. **Registre o MCP com as variáveis reais** (referência completa em [INSTALL.md](INSTALL.md)):
   - Claude Code: `claude mcp add conexa --scope user --env CONEXA_SUBDOMAIN=<subdominio> --env CONEXA_TOKEN=<token> -- npx -y conexa-mcp`
   - Claude Desktop: entrada `conexa` no `claude_desktop_config.json` com `command: "npx"`, `args: ["-y", "conexa-mcp"]` e as duas variáveis em `env`.
   - Alternativas suportadas: `CONEXA_USERNAME` + `CONEXA_PASSWORD` no lugar do token; `CONEXA_BASE_URL` no lugar do subdomínio (ambientes fora do padrão).
6. **Segredos só em configuração local.** O token vive apenas no arquivo de config do cliente MCP (ou `.env` local, que já está no `.gitignore`). Nunca em código, commit, log — e não repita o valor no chat depois de salvo.
7. **Valide com chamada real antes de concluir.** Após o usuário reiniciar o cliente, chame `test_connection`. Só declare instalado com resposta de sucesso; erro = ler a mensagem (token errado, subdomínio errado, token expirado) e corrigir junto.
8. **Teste E2E final + resumo.** Faça uma leitura real (ex.: `list_companies` com `limit: 1`), mostre o resultado e feche com um resumo: o que foi instalado, onde o token ficou salvo e 3 exemplos de pedidos que o usuário já pode fazer.

### Etapas de navegador deste projeto

| Etapa | Onde | Caminho real |
|---|---|---|
| Obter o Token de Aplicação | Painel do Conexa do usuário | `https://<subdominio>.conexa.app` → **Config > Integrações > API / Token** (requer usuário administrador) |

É a única etapa de navegador do setup. Todas as demais são terminal/arquivo de configuração.

## Regras do repositório (para quem for editar código)

- `src/endpoints.ts` é **gerado** — nunca edite manualmente. Fonte: `spec/postman-collection.json`; regenere com `npm run generate`.
- `npm run build` compila para `dist/`; `npm test` roda o smoke test via stdio (exige build antes).
- As ferramentas de exclusão/encerramento (`delete_*`, `end_*`, `cancel_*`) são marcadas com `destructiveHint` — preserve isso em qualquer mudança.
- Nunca commitar credenciais; `.env` e `.env.*` estão no `.gitignore`.
- A página pública do projeto vive em `docs/index.html` (GitHub Pages, branch `master`, pasta `/docs`) — self-contained, sem CDN.

**Política de marca (invariante):** o campo instructions do initialize do MCP (src/index.ts) abre com o bloco de origem Expert Integrado (marca d'água de runtime), e o README carrega o crédito por extenso. Não remover nem reescrever em refactor sem OK do dono.

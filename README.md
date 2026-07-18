# Conexa MCP

Open source, criado por **Eric Luciano** na **Mentoria Automações Inteligentes** (Expert Integrado).

**[→ Como funciona o Conexa MCP](https://expert-integrado.github.io/conexa-mcp/)** — a página do projeto, com o sistema explicado visualmente.

Conecte o **Claude** (ou qualquer assistente de IA compatível com MCP) ao seu sistema **[Conexa](https://conexa.app)**.

Depois de instalado, você pode simplesmente conversar com a IA:

> *"Liste as cobranças em aberto deste mês"*
> *"Cadastre o cliente João da Silva, CPF 123.456.789-00"*
> *"Quais salas estão reservadas para amanhã?"*
> *"Crie uma venda do produto X para o cliente Y"*

São **83 ferramentas** cobrindo toda a API v2 do Conexa: vendas, clientes, pessoas, planos, contratos, vendas recorrentes, produtos, cobranças, despesas, fornecedores, campos extras, centros de custo, contas, unidades, reservas de sala, check-in/check-out e mais.

---

## 🚀 Instalação com ajuda da IA (recomendado)

**Não precisa entender de programação.** Copie o bloco abaixo e cole em uma conversa com o Claude (Claude Code, Claude Desktop ou outro agente de IA que consiga executar comandos no seu computador). Ele verifica os pré-requisitos, **oferece pilotar o navegador** na etapa do token e só declara pronto depois de **validar a conexão de verdade**.

Pré-requisitos: **Node.js 18+** · um cliente MCP (**Claude Code** ou **Claude Desktop**) · **acesso de administrador** ao seu Conexa.

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

### O que você vai precisar ter em mãos

| Informação | Onde encontrar |
|---|---|
| **Subdomínio** | O endereço que você usa para acessar o Conexa: `SEUSUBDOMINIO.conexa.app` |
| **Token de Aplicação** | Dentro do Conexa: **Config > Integrações > API / Token** (precisa ser administrador) |

> Guia detalhado passo a passo — incluindo Claude Desktop, execução a partir do código-fonte e solução de problemas: **[INSTALL.md](INSTALL.md)**.

---

## 🔧 Instalação manual

<details>
<summary><strong>Claude Code (terminal)</strong></summary>

```bash
claude mcp add conexa --scope user \
  --env CONEXA_SUBDOMAIN=minhaempresa \
  --env CONEXA_TOKEN=seu_token_aqui \
  -- npx -y conexa-mcp
```

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Edite o arquivo `claude_desktop_config.json` (menu **Configurações > Desenvolvedor > Editar configuração**) e adicione dentro de `mcpServers`:

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

</details>

<details>
<summary><strong>Rodando a partir do código-fonte</strong></summary>

```bash
git clone https://github.com/Expert-Integrado/conexa-mcp.git
cd conexa-mcp
npm install
npm run build
```

E aponte seu cliente MCP para `node <caminho>/conexa-mcp/dist/index.js` com as variáveis de ambiente abaixo.

</details>

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `CONEXA_SUBDOMAIN` | Sim* | Subdomínio do seu Conexa (`minhaempresa` de `minhaempresa.conexa.app`) |
| `CONEXA_TOKEN` | Sim** | Token de Aplicação (recomendado) — criado em **Config > Integrações > API / Token** |
| `CONEXA_USERNAME` / `CONEXA_PASSWORD` | Alternativa** | Login e senha de um usuário admin/funcionário. O servidor faz o login e renova a sessão sozinho |
| `CONEXA_BASE_URL` | Alternativa* | URL completa da API, caso seu ambiente não siga o padrão `https://X.conexa.app/index.php/api/v2` |

\* Informe `CONEXA_SUBDOMAIN` **ou** `CONEXA_BASE_URL` · \*\* Informe `CONEXA_TOKEN` **ou** usuário e senha.

---

## 🔒 Segurança

- O token **nunca sai do seu computador**: fica apenas no arquivo de configuração local do seu cliente MCP e é enviado somente para o seu próprio Conexa (`https://SEUSUBDOMINIO.conexa.app`).
- Nada de credenciais no código, em logs ou neste repositório.
- O servidor respeita o limite oficial de **60 requisições/minuto** da API (com espera automática) e tenta novamente sozinho quando o limite é atingido.
- Ferramentas de exclusão/encerramento são marcadas como **destrutivas** — clientes como o Claude pedem sua confirmação antes de executá-las.

## 🧰 Ferramentas disponíveis

Uma ferramenta para cada endpoint da [API v2 do Conexa](https://documenter.getpostman.com/view/25182821/2s93RZMpcB), organizadas por área:

| Área | Ferramentas |
|---|---|
| Vendas | `create_sale`, `get_sale`, `update_sale`, `delete_sale`, `list_sales` |
| Clientes | `create_customer`, `get_customer`, `update_customer`, `delete_customer`, `list_customers` |
| Pessoas | `create_person`, `get_person`, `update_person`, `delete_person`, `list_persons` |
| Planos | `create_plan`, `get_plan`, `update_plan`, `delete_plan`, `list_plans` |
| Contratos | `create_contract`, `get_contract`, `update_contract`, `end_contract`, `delete_contract`, `list_contracts`, `request_contract_signature` |
| Vendas recorrentes | `create_recurring_sale`, `get_recurring_sale`, `update_recurring_sale`, `end_recurring_sale`, `delete_recurring_sale`, `list_recurring_sales` |
| Produtos | `create_product`, `get_product`, `update_product`, `delete_product`, `list_products` |
| Cobranças | `create_charge`, `get_charge`, `list_charges`, `settle_charge`, `get_charge_pix`, `create_credit_card` |
| Financeiro | `create_bill`, `get_bill`, `list_bills`, `get_bill_category`, `list_bill_categories`, `get_bill_subcategory`, `list_bill_subcategories`, `get_cost_center`, `list_cost_centers`, `get_account`, `list_accounts` |
| Meios de pagamento | `get_invoicing_method`, `list_invoicing_methods`, `get_receiving_method`, `list_receiving_methods`, `get_payment_method`, `list_payment_methods` |
| Fornecedores | `create_supplier`, `get_supplier`, `list_suppliers` |
| Campos extras | `create_extra_field`, `get_extra_field`, `update_extra_field`, `delete_extra_field`, `list_extra_fields` |
| Unidades e serviços | `get_company`, `list_companies`, `get_service_category`, `list_service_categories` |
| Leads | `create_potential_customer` |
| Coworking | `create_room_booking`, `get_room_booking`, `update_room_booking`, `cancel_room_booking`, `checkout_room_booking`, `list_room_bookings`, `create_checkin`, `create_checkout` |
| Utilitário | `test_connection` |

Observações:

- A rota `POST /auth` da API não vira ferramenta: o próprio servidor a utiliza internamente quando você configura usuário/senha.
- Listagens usam paginação (`limit`/`offset`) e aceitam os filtros documentados pela API (ex.: `customerId`, `status`, datas). Filtros de múltiplos valores aceitam vírgula: `"450,216"`.
- [Webhooks do Conexa](https://documenter.getpostman.com/view/25182821/2sBXwsKVK6) estão fora do escopo deste servidor (webhooks exigem um serviço recebendo chamadas na internet, não um servidor local).

## 👩‍💻 Para desenvolvedores

```bash
npm install        # dependências
npm run generate   # regenera src/endpoints.ts a partir de spec/postman-collection.json
npm run build      # compila TypeScript para dist/
npm test           # smoke test (handshake MCP + contagem de tools via stdio)
```

As definições das 82 ferramentas de API são **geradas automaticamente** da collection Postman oficial (`spec/postman-collection.json`). Quando a Conexa atualizar a documentação, basta baixar a collection nova e rodar `npm run generate`.

## Licença

[MIT](LICENSE)

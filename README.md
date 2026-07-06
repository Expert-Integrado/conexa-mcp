# Conexa MCP

Conecte o **Claude** (ou qualquer assistente de IA compatível com MCP) ao seu sistema **[Conexa](https://conexa.app)**.

Depois de instalado, você pode simplesmente conversar com a IA:

> *"Liste as cobranças em aberto deste mês"*
> *"Cadastre o cliente João da Silva, CPF 123.456.789-00"*
> *"Quais salas estão reservadas para amanhã?"*
> *"Crie uma venda do produto X para o cliente Y"*

São **83 ferramentas** cobrindo toda a API v2 do Conexa: vendas, clientes, pessoas, planos, contratos, vendas recorrentes, produtos, cobranças, despesas, fornecedores, campos extras, centros de custo, contas, unidades, reservas de sala, check-in/check-out e mais.

---

## 🚀 Instalação com ajuda da IA (recomendado)

**Não precisa entender de programação.** Copie o bloco abaixo e cole em uma conversa com o Claude (Claude Code, Claude Desktop ou outro agente de IA que consiga executar comandos no seu computador). Ele cuida de tudo e pede as informações necessárias.

```text
Quero instalar o servidor MCP do Conexa (https://github.com/AsafeSilva/conexa-mcp) neste computador. Siga estes passos:

1. Verifique se o Node.js 18 ou superior está instalado (node --version). Se não estiver, me oriente a instalar pelo site https://nodejs.org antes de continuar.

2. Me pergunte estas duas informações (não continue sem elas):
   a) SUBDOMÍNIO do meu Conexa — é a primeira parte do endereço que uso para acessar o sistema. Ex.: se acesso "minhaempresa.conexa.app", o subdomínio é "minhaempresa".
   b) TOKEN DE APLICAÇÃO do Conexa — me explique que ele é criado dentro do sistema Conexa, no menu Config > Integrações > API / Token, por um usuário administrador. Se eu não tiver o token, me guie para criar um.

3. Configure o servidor MCP no cliente que estou usando:
   - No Claude Code, use: claude mcp add conexa --scope user --env CONEXA_SUBDOMAIN=<subdominio> --env CONEXA_TOKEN=<token> -- npx -y github:AsafeSilva/conexa-mcp
   - No Claude Desktop, adicione ao arquivo claude_desktop_config.json a entrada do servidor "conexa" com command "npx", args ["-y", "github:AsafeSilva/conexa-mcp"] e as variáveis de ambiente CONEXA_SUBDOMAIN e CONEXA_TOKEN.
   - Em outros clientes MCP, use a configuração equivalente (command: npx -y github:AsafeSilva/conexa-mcp + as duas variáveis de ambiente).

4. IMPORTANTE sobre segurança: grave o token SOMENTE no arquivo de configuração local do MCP. Não repita o token na conversa, não salve em outros arquivos e nunca envie para a internet ou para um repositório.

5. Peça para eu reiniciar o cliente de IA (fechar e abrir) e, em seguida, teste executando a ferramenta "test_connection" do servidor conexa. Se aparecer "✅ Conexão com o Conexa funcionando", a instalação terminou. Se der erro, leia a mensagem e me ajude a corrigir (token errado, subdomínio errado ou token expirado são as causas mais comuns).
```

### O que você vai precisar ter em mãos

| Informação | Onde encontrar |
|---|---|
| **Subdomínio** | O endereço que você usa para acessar o Conexa: `SEUSUBDOMINIO.conexa.app` |
| **Token de Aplicação** | Dentro do Conexa: **Config > Integrações > API / Token** (precisa ser administrador) |

---

## 🔧 Instalação manual

<details>
<summary><strong>Claude Code (terminal)</strong></summary>

```bash
claude mcp add conexa --scope user \
  --env CONEXA_SUBDOMAIN=minhaempresa \
  --env CONEXA_TOKEN=seu_token_aqui \
  -- npx -y github:AsafeSilva/conexa-mcp
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
      "args": ["-y", "github:AsafeSilva/conexa-mcp"],
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
git clone https://github.com/AsafeSilva/conexa-mcp.git
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

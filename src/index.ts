#!/usr/bin/env node
// conexa-mcp — Servidor MCP para a API v2 do Conexa (conexa.app).
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z, type ZodRawShape } from 'zod';
import { endpoints, type EndpointDef } from './endpoints.js';
import { ConexaApiError, ConexaClient, ConfigError, configFromEnv } from './client.js';

const VERSION = '0.1.0';

let client: ConexaClient | null = null;
let configError: string | null = null;
try {
  client = new ConexaClient(configFromEnv());
} catch (e) {
  configError = e instanceof ConfigError ? e.message : String(e);
  console.error(`[conexa-mcp] ${configError}`);
}

const server = new McpServer({ name: 'conexa-mcp', version: VERSION });

function textResult(text: string, isError = false) {
  return { content: [{ type: 'text' as const, text }], isError };
}

function toolResponse(data: unknown) {
  return textResult(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

function errorResponse(e: unknown) {
  if (e instanceof ConexaApiError) {
    const body = typeof e.data === 'string' ? e.data : JSON.stringify(e.data, null, 2);
    return textResult(`Erro ${e.status} da API Conexa:\n${body}`, true);
  }
  return textResult(`Erro: ${e instanceof Error ? e.message : String(e)}`, true);
}

function buildDescription(ep: EndpointDef): string {
  const parts = [ep.description];
  if (ep.bodyDoc) parts.push(`Campos do body:\n${ep.bodyDoc}`);
  else if (ep.bodyExample) parts.push(`Exemplo de body:\n${ep.bodyExample}`);
  return parts.join('\n\n');
}

function buildSchema(ep: EndpointDef): ZodRawShape {
  const shape: ZodRawShape = {};
  for (const p of ep.pathParams) {
    shape[p] = z.union([z.number(), z.string()]).describe(`Valor de :${p} na rota ${ep.path}`);
  }
  if (ep.isList) {
    shape.limit = z.number().int().min(1).max(100).optional()
      .describe('Quantidade de itens por página (padrão 20, máx. 100)');
    shape.offset = z.number().int().min(0).optional().describe('Posição inicial da busca (paginação)');
  }
  for (const q of ep.queryParams) {
    shape[q.name] = z.union([z.string(), z.number(), z.boolean()]).optional()
      .describe(q.array ? 'Filtro opcional; aceita múltiplos valores separados por vírgula' : 'Filtro opcional');
  }
  if (ep.method === 'POST' || ep.method === 'PATCH') {
    const hasDoc = Boolean(ep.bodyDoc || ep.bodyExample);
    let body = z.record(z.any()).describe('Corpo JSON da requisição (campos na descrição da tool)');
    shape.body = hasDoc ? body : body.optional();
  }
  return shape;
}

for (const ep of endpoints) {
  const arrayKeys = new Set(ep.queryParams.filter((q) => q.array).map((q) => q.name));
  const queryKeys = new Set(ep.queryParams.map((q) => q.name));
  const destructive = ep.method === 'DELETE' || /^(end|cancel)_/.test(ep.toolName);

  server.registerTool(
    ep.toolName,
    {
      title: `${ep.method} ${ep.path} (${ep.folder})`,
      description: buildDescription(ep),
      inputSchema: buildSchema(ep),
      annotations: {
        readOnlyHint: ep.method === 'GET',
        destructiveHint: destructive,
        openWorldHint: true,
      },
    },
    async (args: Record<string, unknown>) => {
      if (!client) return textResult(configError ?? 'Servidor não configurado.', true);
      const pathParams: Record<string, string | number> = {};
      const query: Record<string, string | number | boolean | undefined> = {};
      let body: unknown;
      for (const [key, value] of Object.entries(args)) {
        if (value === undefined) continue;
        if (key === 'body') body = value;
        else if (ep.pathParams.includes(key)) pathParams[key] = value as string | number;
        else if (key === 'limit' || key === 'offset' || queryKeys.has(key)) {
          query[key] = value as string | number | boolean;
        }
      }
      if (ep.isList && query.limit === undefined) query.limit = 20;
      try {
        const data = await client.request(ep.method, ep.path, { pathParams, query, arrayKeys, body });
        return toolResponse(data ?? { ok: true, status: 'Operação realizada com sucesso (resposta vazia).' });
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

server.registerTool(
  'test_connection',
  {
    title: 'Testar conexão com o Conexa',
    description:
      'Verifica se a autenticação com a API do Conexa está funcionando. Use após a instalação para confirmar que tudo está configurado.',
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async () => {
    if (!client) return textResult(configError ?? 'Servidor não configurado.', true);
    try {
      const data = (await client.request('GET', '/companies', { query: { limit: 1 } })) as {
        data?: Array<{ id?: number; tradeName?: string; legalName?: string }>;
      };
      const company = data?.data?.[0];
      const name = company?.tradeName || company?.legalName || 'unidade encontrada';
      return textResult(`✅ Conexão com o Conexa funcionando! Primeira unidade: ${name} (id ${company?.id ?? '?'}).`);
    } catch (e) {
      return errorResponse(e);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[conexa-mcp] v${VERSION} pronto — ${endpoints.length + 1} tools disponíveis.`);

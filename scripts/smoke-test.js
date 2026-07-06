#!/usr/bin/env node
// Smoke test: sobe o servidor via stdio e valida handshake MCP, contagem de tools
// e resposta de erro amigável quando não há credenciais configuradas.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env };
delete env.CONEXA_SUBDOMAIN;
delete env.CONEXA_BASE_URL;
delete env.CONEXA_TOKEN;
delete env.CONEXA_USERNAME;
delete env.CONEXA_PASSWORD;

const proc = spawn(process.execPath, [path.join(root, 'dist', 'index.js')], {
  env,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';
const pending = new Map();
proc.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let i;
  while ((i = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, i).trim();
    buffer = buffer.slice(i + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});

let nextId = 1;
function rpc(method, params) {
  const id = nextId++;
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    setTimeout(() => reject(new Error(`timeout em ${method}`)), 15000);
  });
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`FALHOU: ${msg}`);
    proc.kill();
    process.exit(1);
  }
  console.log(`ok: ${msg}`);
}

const init = await rpc('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'smoke-test', version: '0.0.0' },
});
assert(init.result?.serverInfo?.name === 'conexa-mcp', 'handshake initialize');
proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

const tools = await rpc('tools/list', {});
const list = tools.result?.tools ?? [];
assert(list.length === 83, `tools/list retorna 83 tools (retornou ${list.length})`);
for (const name of ['create_sale', 'list_charges', 'cancel_room_booking', 'test_connection']) {
  assert(list.some((t) => t.name === name), `tool ${name} presente`);
}
const listSales = list.find((t) => t.name === 'list_sales');
assert(listSales.inputSchema.properties.limit, 'list_sales tem parâmetro limit');
assert(listSales.inputSchema.properties.customerId, 'list_sales tem filtro customerId');

const call = await rpc('tools/call', { name: 'test_connection', arguments: {} });
assert(call.result?.isError === true, 'sem credenciais, tool retorna isError');
assert(String(call.result?.content?.[0]?.text).includes('Configuração ausente'), 'mensagem de configuração amigável');

console.log('\nSmoke test passou.');
proc.kill();
process.exit(0);

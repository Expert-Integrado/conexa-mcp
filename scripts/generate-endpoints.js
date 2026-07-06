#!/usr/bin/env node
// Gera src/endpoints.ts a partir de spec/postman-collection.json (documentação oficial da API v2 Conexa).
// Uso: node scripts/generate-endpoints.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const collection = JSON.parse(fs.readFileSync(path.join(root, 'spec', 'postman-collection.json'), 'utf8'));

// ---------- helpers de HTML -> texto ----------
function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function stripTags(html) {
  return decodeEntities(String(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

// Converte a primeira <table> após um heading cujo texto contém `headingRe` em linhas "- campo (tipo) [obrigatório]: descrição"
function parseTableAfterHeading(html, headingRe) {
  const h = String(html).match(new RegExp(`<h[1-6][^>]*>[^<]*${headingRe}[^<]*</h[1-6]>`, 'i'));
  if (!h) return null;
  const rest = String(html).slice(h.index + h[0].length);
  const t = rest.match(/<table>[\s\S]*?<\/table>/i);
  if (!t) return null;
  return parseTable(t[0]);
}

function parseTable(tableHtml) {
  const headers = [...tableHtml.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => stripTags(m[1]).toLowerCase());
  const bodyHtml = (tableHtml.match(/<tbody>[\s\S]*?<\/tbody>/i) || [tableHtml])[0];
  const rows = [...bodyHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].map((m) =>
    [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => stripTags(c[1]))
  );
  const idx = (names) => headers.findIndex((h) => names.some((n) => h.includes(n)));
  const iName = idx(['index', 'key', 'campo']);
  const iType = idx(['type', 'tipo']);
  const iDesc = idx(['description', 'descrição', 'descricao']);
  const iReq = idx(['required', 'obrigatório', 'obrigatorio']);
  const lines = [];
  for (const cells of rows) {
    if (!cells.length) continue;
    const name = iName >= 0 ? cells[iName] : cells[0];
    if (!name || name === '...') continue;
    const type = iType >= 0 ? cells[iType] : '';
    const desc = iDesc >= 0 ? cells[iDesc] : '';
    const req = iReq >= 0 && /^sim|yes|true$/i.test(cells[iReq] || '') ? ' [obrigatório]' : '';
    lines.push(`- ${name}${type ? ` (${type})` : ''}${req}: ${desc}`.trim());
  }
  return lines.length ? lines.join('\n') : null;
}

// Texto introdutório: tudo antes do primeiro heading/tabela
function introText(html) {
  const cut = String(html).search(/<h[1-6][^>]*>|<table>/i);
  const intro = stripTags(cut >= 0 ? String(html).slice(0, cut) : html);
  return intro.length > 700 ? intro.slice(0, 700) + '…' : intro;
}

// ---------- nomeação das tools ----------
const snake = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toLowerCase();

const NAME_OVERRIDES = {
  'PATCH /contract/end/:id': 'end_contract',
  'PATCH /recurringSale/end/:id': 'end_recurring_sale',
  'POST /contract/:id/signature/request': 'request_contract_signature',
  'PATCH /charge/settle/:id': 'settle_charge',
  'GET /charge/pix/:id': 'get_charge_pix',
  'PATCH /room/booking/:id/cancel': 'cancel_room_booking',
  'POST /room/booking/:id/checkout': 'checkout_room_booking',
  'POST /checkin': 'create_checkin',
  'POST /checkout': 'create_checkout',
};

function toolName(method, p) {
  const key = `${method} ${p}`;
  if (NAME_OVERRIDES[key]) return NAME_OVERRIDES[key];
  const segments = p.split('/').filter((s) => s && !s.startsWith(':'));
  const base = snake(segments.join('_'));
  const hasId = p.includes(':');
  if (method === 'GET') return hasId ? `get_${base}` : `list_${base}`;
  if (method === 'POST') return `create_${base}`;
  if (method === 'PATCH') return `update_${base}`;
  if (method === 'DELETE') return `delete_${base}`;
  return `${method.toLowerCase()}_${base}`;
}

// ---------- coleta de query params (URL da request + URLs dos exemplos) ----------
function queryKeysFromUrl(url) {
  const raw = typeof url === 'string' ? url : url && url.raw;
  if (!raw || !raw.includes('?')) return [];
  return raw
    .split('?')[1]
    .split('&')
    .map((kv) => kv.split('=')[0])
    .filter(Boolean);
}

// ---------- percorre a collection ----------
const endpoints = [];

function walk(items, folder) {
  for (const it of items) {
    if (it.item) {
      walk(it.item, folder ? `${folder} > ${it.name}` : it.name);
      continue;
    }
    if (!it.request) continue;
    const req = it.request;
    const rawUrl = typeof req.url === 'string' ? req.url : (req.url && req.url.raw) || '';
    const p = ('/' + (rawUrl.split('/api/v2/')[1] || '')).split('?')[0].replace(/\/$/, '');
    if (!p || p === '/') continue;
    if (req.method === 'POST' && p === '/auth') continue; // autenticação é tratada internamente pelo servidor

    const descHtml = String((req.description && (req.description.content || req.description)) || '');
    const pathParams = (p.match(/:([a-zA-Z0-9_]+)/g) || []).map((s) => s.slice(1));
    const isList = req.method === 'GET' && pathParams.length === 0;

    // filtros observados na documentação (request + exemplos)
    const keys = new Map(); // base -> usesBrackets
    for (const k of [
      ...queryKeysFromUrl(rawUrl),
      ...(it.response || []).flatMap((r) => queryKeysFromUrl(r.originalRequest && r.originalRequest.url)),
    ]) {
      const brackets = k.endsWith('[]');
      const base = brackets ? k.slice(0, -2) : k;
      if (['limit', 'offset', 'ofset'].includes(base)) continue;
      keys.set(base, keys.get(base) || brackets);
    }
    const queryParams = [...keys.entries()].map(([name, array]) => ({ name, array }));

    const intro = introText(descHtml);
    const bodyDoc = parseTableAfterHeading(descHtml, 'Body');
    let bodyExample = req.body && req.body.raw ? String(req.body.raw).trim() : null;
    if (bodyExample && bodyExample.length > 1500) bodyExample = bodyExample.slice(0, 1500) + '…';

    let description = intro || '';
    if (!description) description = `${req.method} ${p}`;
    if (description.length > 900) description = description.slice(0, 900) + '…';

    endpoints.push({
      toolName: toolName(req.method, p),
      method: req.method,
      path: p,
      folder,
      description,
      pathParams,
      isList,
      queryParams,
      bodyDoc,
      bodyExample,
    });
  }
}

walk(collection.item, null);

// valida nomes únicos
const seen = new Set();
for (const e of endpoints) {
  if (seen.has(e.toolName)) throw new Error(`Nome de tool duplicado: ${e.toolName}`);
  seen.add(e.toolName);
}

// ---------- emite src/endpoints.ts ----------
const J = (v) => JSON.stringify(v);
const lines = [];
lines.push('// GERADO AUTOMATICAMENTE por scripts/generate-endpoints.js — não edite manualmente.');
lines.push('// Fonte: spec/postman-collection.json (documentação oficial da API v2 Conexa).');
lines.push('');
lines.push('export interface QueryParam { name: string; array?: boolean }');
lines.push('');
lines.push('export interface EndpointDef {');
lines.push('  toolName: string;');
lines.push("  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';");
lines.push('  path: string;');
lines.push('  folder: string;');
lines.push('  description: string;');
lines.push('  pathParams: string[];');
lines.push('  isList: boolean;');
lines.push('  queryParams: QueryParam[];');
lines.push('  bodyDoc?: string;');
lines.push('  bodyExample?: string;');
lines.push('}');
lines.push('');
lines.push('export const endpoints: EndpointDef[] = [');
for (const e of endpoints) {
  const parts = [
    `toolName: ${J(e.toolName)}`,
    `method: ${J(e.method)}`,
    `path: ${J(e.path)}`,
    `folder: ${J(e.folder)}`,
    `description: ${J(e.description)}`,
    `pathParams: ${J(e.pathParams)}`,
    `isList: ${e.isList}`,
    `queryParams: ${J(e.queryParams)}`,
  ];
  if (e.bodyDoc) parts.push(`bodyDoc: ${J(e.bodyDoc)}`);
  if (e.bodyExample) parts.push(`bodyExample: ${J(e.bodyExample)}`);
  lines.push(`  { ${parts.join(', ')} },`);
}
lines.push('];');
lines.push('');

fs.writeFileSync(path.join(root, 'src', 'endpoints.ts'), lines.join('\n'), 'utf8');
console.log(`src/endpoints.ts gerado com ${endpoints.length} endpoints.`);

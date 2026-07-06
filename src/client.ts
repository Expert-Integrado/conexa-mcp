// Cliente HTTP da API v2 Conexa: autenticação, rate limit e tratamento de erros.

export interface ConexaConfig {
  baseUrl: string;
  token?: string;
  username?: string;
  password?: string;
}

export class ConfigError extends Error {}

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): ConexaConfig {
  const subdomain = env.CONEXA_SUBDOMAIN?.trim();
  let baseUrl = env.CONEXA_BASE_URL?.trim();
  if (!baseUrl && subdomain) baseUrl = `https://${subdomain}.conexa.app/index.php/api/v2`;
  if (!baseUrl) {
    throw new ConfigError(
      'Configuração ausente: defina CONEXA_SUBDOMAIN (ex.: "minhaempresa", do endereço minhaempresa.conexa.app) ou CONEXA_BASE_URL.'
    );
  }
  const token = env.CONEXA_TOKEN?.trim();
  const username = env.CONEXA_USERNAME?.trim();
  const password = env.CONEXA_PASSWORD;
  if (!token && !(username && password)) {
    throw new ConfigError(
      'Configuração ausente: defina CONEXA_TOKEN (Token de Aplicação, criado no Conexa em Config > Integrações > API / Token) ou o par CONEXA_USERNAME + CONEXA_PASSWORD.'
    );
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), token, username, password };
}

export class ConexaApiError extends Error {
  constructor(
    public status: number,
    public data: unknown
  ) {
    super(`Conexa API respondeu ${status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
}

interface RequestOptions {
  pathParams?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | undefined>;
  arrayKeys?: Set<string>;
  body?: unknown;
}

const RATE_LIMIT = 55; // margem sob o limite de 60 req/min da API
const WINDOW_MS = 60_000;

export class ConexaClient {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private requestTimes: number[] = [];

  constructor(private cfg: ConexaConfig) {}

  private async throttle(): Promise<void> {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter((t) => now - t < WINDOW_MS);
    if (this.requestTimes.length >= RATE_LIMIT) {
      const wait = WINDOW_MS - (now - this.requestTimes[0]) + 100;
      await new Promise((r) => setTimeout(r, wait));
    }
    this.requestTimes.push(Date.now());
  }

  private async login(): Promise<string> {
    const res = await fetch(`${this.cfg.baseUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.cfg.username, password: this.cfg.password }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.accessToken) {
      throw new ConexaApiError(res.status, data ?? 'Falha na autenticação com usuário e senha.');
    }
    this.accessToken = data.accessToken as string;
    this.tokenExpiresAt = Date.now() + (Number(data.expiresIn) || 3600) * 1000 - 60_000;
    return this.accessToken;
  }

  private async getToken(): Promise<string> {
    if (this.cfg.token) return this.cfg.token;
    if (this.accessToken && Date.now() < this.tokenExpiresAt) return this.accessToken;
    return this.login();
  }

  buildUrl(path: string, opts: RequestOptions): string {
    let p = path;
    for (const [key, value] of Object.entries(opts.pathParams ?? {})) {
      p = p.replace(`:${key}`, encodeURIComponent(String(value)));
    }
    const url = new URL(this.cfg.baseUrl + p);
    for (const [key, value] of Object.entries(opts.query ?? {})) {
      if (value === undefined || value === null || value === '') continue;
      const name = opts.arrayKeys?.has(key) ? `${key}[]` : key;
      url.searchParams.append(name, String(value));
    }
    return url.toString();
  }

  async request(method: string, path: string, opts: RequestOptions = {}): Promise<unknown> {
    const url = this.buildUrl(path, opts);
    for (let attempt = 0; ; attempt++) {
      await this.throttle();
      const token = await this.getToken();
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });

      // Token de sessão expirado no modo usuário/senha: reautentica uma vez
      if (res.status === 401 && !this.cfg.token && attempt === 0) {
        this.accessToken = null;
        continue;
      }
      // Rate limit excedido: aguarda o reset informado e tenta mais uma vez
      if (res.status === 429 && attempt === 0) {
        const reset = Number(res.headers.get('X-Rate-Limit-Reset')) || 60;
        await new Promise((r) => setTimeout(r, Math.min(reset, 65) * 1000));
        continue;
      }

      const text = await res.text();
      let data: unknown = text;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // resposta não-JSON: mantém texto
      }
      if (!res.ok) throw new ConexaApiError(res.status, data);
      return data;
    }
  }
}

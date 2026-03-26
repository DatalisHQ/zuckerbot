// ── ZuckerBot API Client ─────────────────────────────────────────────

export class ZuckerBotApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ZuckerBotApiError";
  }
}

export class ZuckerBotClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | null;
  private readonly userAgent: string;
  readonly authenticated: boolean;

  constructor(apiKey: string | null, version: string) {
    this.baseUrl = (
      process.env.ZUCKERBOT_API_URL || "https://zuckerbot.ai/api/v1"
    ).replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.authenticated = !!apiKey;
    this.userAgent = `zuckerbot-mcp/${version}`;
  }

  requireAuth(): void {
    if (this.authenticated) return;

    throw new ZuckerBotApiError(
      401,
      "no_api_key",
      "ZUCKERBOT_API_KEY is not configured. Get your API key at https://zuckerbot.ai/developer.",
    );
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "User-Agent": this.userAgent,
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
    };
  }

  private async handleResponse(response: Response): Promise<unknown> {
    const body = await response.text();

    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      data = { raw: body };
    }

    if (!response.ok) {
      const err =
        data && typeof data === "object" && "error" in data
          ? (data as { error: { code?: string; message?: string; retry_after?: number } }).error
          : null;

      const code = err?.code || `http_${response.status}`;
      const message = err?.message || `API request failed with status ${response.status}`;
      const retryAfter = err?.retry_after;

      switch (response.status) {
        case 401:
          throw new ZuckerBotApiError(
            401,
            code,
            `Authentication failed: ${message}. Check your ZUCKERBOT_API_KEY.`,
          );
        case 429:
          throw new ZuckerBotApiError(
            429,
            code,
            `Rate limit exceeded: ${message}${retryAfter ? ` Retry after ${retryAfter}s.` : ""}`,
            retryAfter,
          );
        case 502:
          throw new ZuckerBotApiError(
            502,
            code,
            `Upstream generation error: ${message}`,
          );
        default:
          throw new ZuckerBotApiError(response.status, code, message, retryAfter);
      }
    }

    return data;
  }

  async get(path: string): Promise<unknown> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.headers(),
    });
    return this.handleResponse(response);
  }

  async post(path: string, body?: Record<string, unknown>): Promise<unknown> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(response);
  }

  async put(path: string, body?: Record<string, unknown>): Promise<unknown> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(response);
  }

  async delete(path: string): Promise<unknown> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.headers(),
    });
    return this.handleResponse(response);
  }
}

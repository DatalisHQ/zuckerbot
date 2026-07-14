// ── ZuckerBot API Client ─────────────────────────────────────────────

// Hard ceiling for any single backend request. The backend serverless function
// caps out at maxDuration=120s, so a request still pending past this is a
// stalled/black-holed connection, not a slow-but-valid response. Without it,
// fetch() has no timeout and a stalled backend hangs the tool until the MCP
// client's own multi-minute ceiling — with no response and no error.
// Override via ZUCKERBOT_API_TIMEOUT_MS.
const DEFAULT_REQUEST_TIMEOUT_MS = (() => {
  const raw = Number(process.env.ZUCKERBOT_API_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 120_000;
})();

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
  private cachedResolvedBusinessId: string | null;
  readonly authenticated: boolean;

  constructor(apiKey: string | null, version: string) {
    this.baseUrl = (
      process.env.ZUCKERBOT_API_URL || "https://zuckerbot.ai/api/v1"
    ).replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.authenticated = !!apiKey;
    this.userAgent = `zuckerbot-mcp/${version}`;
    this.cachedResolvedBusinessId = null;
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

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<unknown> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers(),
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(DEFAULT_REQUEST_TIMEOUT_MS),
      });
      return await this.handleResponse(response);
    } catch (err) {
      // Preserve HTTP-status errors already classified by handleResponse.
      if (err instanceof ZuckerBotApiError) throw err;

      // A timed-out connection (AbortSignal.timeout → "TimeoutError") or any
      // other network failure. Surface it as a clean error instead of letting
      // the await hang forever with no response and no error.
      const isTimeout = err instanceof Error && err.name === "TimeoutError";
      throw new ZuckerBotApiError(
        isTimeout ? 504 : 503,
        isTimeout ? "request_timeout" : "network_error",
        isTimeout
          ? `Request to ${path} timed out after ${DEFAULT_REQUEST_TIMEOUT_MS}ms — the backend did not respond. Check the ZuckerBot API status, or raise ZUCKERBOT_API_TIMEOUT_MS.`
          : `Network request to ${path} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async get(path: string): Promise<unknown> {
    return this.request("GET", path);
  }

  async post(path: string, body?: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", path, body);
  }

  async put(path: string, body?: Record<string, unknown>): Promise<unknown> {
    return this.request("PUT", path, body);
  }

  async delete(path: string): Promise<unknown> {
    return this.request("DELETE", path);
  }

  async resolveBusinessId(businessId?: string | null): Promise<string> {
    const explicitBusinessId = typeof businessId === "string" ? businessId.trim() : "";
    if (explicitBusinessId) return explicitBusinessId;

    this.requireAuth();
    if (this.cachedResolvedBusinessId) return this.cachedResolvedBusinessId;

    const result = await this.get("/businesses/resolve");
    const record =
      result && typeof result === "object" && !Array.isArray(result)
        ? (result as Record<string, unknown>)
        : null;
    const businessRecord =
      record?.business && typeof record.business === "object" && !Array.isArray(record.business)
        ? (record.business as Record<string, unknown>)
        : null;
    const resolvedBusinessId =
      (typeof record?.business_id === "string" ? record.business_id : "")
      || (typeof businessRecord?.id === "string" ? businessRecord.id : "");

    if (!resolvedBusinessId) {
      throw new ZuckerBotApiError(
        500,
        "business_resolution_failed",
        "Failed to resolve a business ID for this API key.",
      );
    }

    this.cachedResolvedBusinessId = resolvedBusinessId;
    return resolvedBusinessId;
  }
}

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

// ── Declared caller identity (X-10) ─────────────────────────────────
//
// DECLARED, NOT VERIFIED: these labels ride as `x-zb-agent` / `x-zb-session`
// headers so the backend's durable mutation ledger can record WHICH agent
// asked for a mutation. Any bearer of a valid credential can claim any
// label — the server records them verbatim (after sanitisation) and must
// never use them for authorization, entitlements, rate limits or tenancy.
export interface DeclaredClientIdentity {
  agent?: string | null;
  session?: string | null;
}

// Server-side columns cap declared identity at 120 chars; cap here too so a
// runaway label can never bloat requests. Non-printable/control characters
// (incl. CR/LF header injection) are stripped for transport safety.
const DECLARED_IDENTITY_MAX_LENGTH = 120;

function sanitizeIdentityHeaderValue(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[^\x20-\x7e]/g, "").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, DECLARED_IDENTITY_MAX_LENGTH);
}

export class ZuckerBotApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly retryAfter?: number,
    /**
     * Structured fields the API attached to the error envelope beyond
     * code/message/retry_after — e.g. invalid_spec's per-field `errors`
     * array, or spec_build_failed's step/meta_response/cleaned_up. Carried
     * verbatim so tools can surface them instead of a bare message.
     */
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ZuckerBotApiError";
  }
}

export class ZuckerBotClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | null;
  private readonly userAgent: string;
  private readonly version: string;
  private cachedResolvedBusinessId: string | null;
  private declaredAgent: string | null;
  private declaredSession: string | null;
  readonly authenticated: boolean;

  constructor(apiKey: string | null, version: string, identity?: DeclaredClientIdentity) {
    this.baseUrl = (
      process.env.ZUCKERBOT_API_URL || "https://zuckerbot.ai/api/v1"
    ).replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.authenticated = !!apiKey;
    this.userAgent = `zuckerbot-mcp/${version}`;
    this.version = version;
    this.cachedResolvedBusinessId = null;
    this.declaredAgent = sanitizeIdentityHeaderValue(identity?.agent);
    this.declaredSession = sanitizeIdentityHeaderValue(identity?.session);
  }

  /** Update the declared (unverified) caller identity — e.g. once the MCP
   *  initialize handshake reveals clientInfo. Provided fields overwrite;
   *  omitted fields are left untouched. */
  setDeclaredIdentity(identity: DeclaredClientIdentity): void {
    if (identity.agent !== undefined) {
      this.declaredAgent = sanitizeIdentityHeaderValue(identity.agent);
    }
    if (identity.session !== undefined) {
      this.declaredSession = sanitizeIdentityHeaderValue(identity.session);
    }
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
      // Declared identity (X-10): x-zb-client always names this client
      // software; x-zb-agent / x-zb-session are emitted only when declared.
      // All three are declared-not-verified labels for the mutation ledger.
      "x-zb-client": this.userAgent,
      ...(this.declaredAgent ? { "x-zb-agent": this.declaredAgent } : {}),
      ...(this.declaredSession ? { "x-zb-session": this.declaredSession } : {}),
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
    };
  }

  /**
   * Version echo (defect brief v2, D10): pair the backend's x-zb-version
   * header (version+git SHA of the deployment that actually executed the
   * call) with this package's own version, so every tool response answers
   * "is the fix deployed, and which service ran this?" on sight.
   * Defensive header read: unit tests stub fetch with plain objects that
   * may lack `headers` — the echo must never break response handling.
   */
  private zbVersion(response: Response): { server: string | null; client: string } {
    const headers = (response as { headers?: { get?: (name: string) => string | null } }).headers;
    const server = typeof headers?.get === "function" ? headers.get("x-zb-version") : null;
    return { server: server || null, client: this.version };
  }

  private async handleResponse(response: Response): Promise<unknown> {
    const body = await response.text();

    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      data = { raw: body };
    }

    const zbVersion = this.zbVersion(response);

    if (!response.ok) {
      // The API uses two error shapes: nested `{ error: { code, message } }`
      // (most routes) and flat `{ error: true, code, message }` (a few audit
      // routes). Parse both so codes like `audit_report_business_required`
      // survive the round-trip instead of collapsing to `http_400`.
      const obj = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      const nested =
        obj && typeof obj.error === "object" && obj.error !== null
          ? (obj.error as { code?: string; message?: string; retry_after?: number })
          : null;
      const flat = obj && obj.error === true ? (obj as { code?: string; message?: string; retry_after?: number }) : null;
      const err = nested || flat;

      const code = err?.code || `http_${response.status}`;
      const message = err?.message || `API request failed with status ${response.status}`;
      const retryAfter = err?.retry_after;

      // Preserve every OTHER field on the error envelope (per-field `errors`
      // arrays, build-failure step/meta_response, etc.) so validation detail
      // survives to the tool surface instead of collapsing to one message.
      let details: Record<string, unknown> | undefined;
      if (err) {
        const rest: Record<string, unknown> = { ...(err as Record<string, unknown>) };
        delete rest.code;
        delete rest.message;
        delete rest.retry_after;
        if (err === flat) delete rest.error;
        if (Object.keys(rest).length > 0) details = rest;
      }
      details = { ...(details || {}), zb_version: zbVersion };

      switch (response.status) {
        case 401:
          throw new ZuckerBotApiError(
            401,
            code,
            `Authentication failed: ${message}. Check your ZUCKERBOT_API_KEY.`,
            undefined,
            details,
          );
        case 429:
          throw new ZuckerBotApiError(
            429,
            code,
            `Rate limit exceeded: ${message}${retryAfter ? ` Retry after ${retryAfter}s.` : ""}`,
            retryAfter,
            details,
          );
        case 502:
          throw new ZuckerBotApiError(
            502,
            code,
            `Upstream generation error: ${message}`,
            undefined,
            details,
          );
        default:
          throw new ZuckerBotApiError(response.status, code, message, retryAfter, details);
      }
    }

    // Additive echo on plain-object successes only — a top-level array
    // (no v1 endpoint returns one today) keeps its shape untouched.
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return { ...(data as Record<string, unknown>), zb_version: zbVersion };
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
        undefined,
        // No server was reached — say so explicitly (D10).
        { zb_version: { server: null, client: this.version } },
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

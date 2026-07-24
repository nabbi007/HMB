import { API_URL } from "./config";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

type ApiOptions = RequestInit & { token?: string };

/**
 * Thin fetch wrapper around the HMB backend.
 * - Prefixes the API base URL.
 * - Sends/parses JSON.
 * - Attaches a bearer token when provided.
 * - Throws ApiError with the backend's { detail } on non-2xx.
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const detail =
      (body && typeof body === "object" && "detail" in body && String(body.detail)) ||
      res.statusText;
    throw new ApiError(res.status, detail);
  }

  return body as T;
}

/** Convenience check used by the landing page to confirm backend wiring. */
export async function checkApiHealth(): Promise<
  { ok: true; status: string } | { ok: false; error: string }
> {
  try {
    const data = await api<{ status: string }>("/health", { cache: "no-store" });
    return { ok: true, status: data.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

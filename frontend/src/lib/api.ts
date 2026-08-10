export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000"

/** Turn a stored "/uploads/x" path into a full URL the browser can load. */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return path.startsWith("http") ? path : `${API_URL}${path}`
}

/** Upload a file (multipart) and get back its stored URL path. */
export async function uploadFile(file: File, token?: string): Promise<{ url: string }> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${API_URL}/api/v1/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  const data = res.headers.get("content-type")?.includes("application/json")
    ? await res.json()
    : null
  if (!res.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data ? String(data.detail) : res.statusText
    throw new ApiError(res.status, detail)
  }
  return data as { url: string }
}

export class ApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}

interface ApiOptions {
  method?: string
  body?: unknown
  token?: string
}

/**
 * Thin fetch wrapper around the HMB backend:
 * - prefixes the API base URL (VITE_API_URL, default http://localhost:8000)
 * - sends/receives JSON
 * - attaches a bearer token when given
 * - throws ApiError carrying the backend's { detail } on non-2xx
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const isJson = res.headers.get("content-type")?.includes("application/json")
  const data = isJson ? await res.json() : null

  if (!res.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data ? String(data.detail) : res.statusText
    throw new ApiError(res.status, detail)
  }

  return data as T
}

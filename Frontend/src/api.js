export const API_URL = import.meta.env.VITE_API_URL || "/api"

const DEFAULT_TIMEOUT_MS = 20000

export async function apiFetch(path, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, ...rest } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...rest,
      signal: rest.signal || controller.signal,
      headers: {
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...rest.headers,
      },
    })
    const data = await res.json().catch(() => ({}))
    return { res, data }
  } finally {
    clearTimeout(timer)
  }
}
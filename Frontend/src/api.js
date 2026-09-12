export const API_URL = import.meta.env.VITE_API_URL

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}
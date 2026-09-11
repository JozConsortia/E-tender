const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const TOKEN_KEY = 'etender-api-token'

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.message || `Request failed with status ${response.status}`)
  return data as T
}

export { API_BASE }

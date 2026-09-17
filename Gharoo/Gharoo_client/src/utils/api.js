const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function apiUrl(path) {
  return `${configuredApiUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options)
}
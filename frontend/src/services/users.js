const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message ?? 'No se pudo completar la solicitud')
  }

  return payload
}

export function getUsers(search = '') {
  const query = new URLSearchParams()

  if (typeof search === 'string' && search.trim()) {
    query.set('search', search.trim())
  }

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return requestJson(`/users${suffix}`)
}

export function createUser(data) {
  return requestJson('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateUser(userId, data) {
  return requestJson(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteUser(userId) {
  return requestJson(`/users/${userId}`, {
    method: 'DELETE',
  })
}
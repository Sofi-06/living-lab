const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function requestJson(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message ?? 'No se pudo completar la solicitud')
  }

  return payload
}

export function getProjects(search = '', options = {}) {
  const query = new URLSearchParams()

  if (typeof search === 'string' && search.trim()) {
    query.set('search', search.trim())
  }

  if (options?.userId !== undefined && options?.userId !== null && options.userId !== '') {
    query.set('userId', String(options.userId))
  }

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return requestJson(`/projects${suffix}`)
}

export function getProject(projectId) {
  return requestJson(`/projects/${projectId}`)
}

export function createProject(data) {
  return requestJson('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateProject(projectId, data) {
  return requestJson(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function createProjectEvidence(projectId, data) {
  return requestJson(`/projects/${projectId}/evidences`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteProject(projectId) {
  return requestJson(`/projects/${projectId}`, {
    method: 'DELETE',
  })
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function requestJson(path, options = {}) {
  const headers = {}

  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
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

export function getRepresentativeProjects(representanteId, search = '') {
  const query = new URLSearchParams()

  if (typeof search === 'string' && search.trim()) {
    query.set('search', search.trim())
  }

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return requestJson(`/projects/representative/${representanteId}${suffix}`)
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

export function updateProjectEvaluation(projectId, data) {
  return requestJson(`/projects/${projectId}/evaluation`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function updateProjectBusinessValidation(projectId, data) {
  if (data?.firmaArchivo instanceof File) {
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'firmaArchivo') {
        formData.append(key, value)
        return
      }

      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })

    return requestJson(`/projects/${projectId}/business-validation`, {
      method: 'PATCH',
      body: formData,
    })
  }

  return requestJson(`/projects/${projectId}/business-validation`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function createProjectEvidence(projectId, data) {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value)
    }
  })

  return requestJson(`/projects/${projectId}/evidences`, {
    method: 'POST',
    body: formData,
  })
}

export function deleteProject(projectId) {
  return requestJson(`/projects/${projectId}`, {
    method: 'DELETE',
  })
}

export function deleteProjectEvidence(projectId, evidenceId) {
  return requestJson(`/projects/${projectId}/evidences/${evidenceId}`, {
    method: 'DELETE',
  })
}

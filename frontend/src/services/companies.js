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

export function getCompanies(search = '') {
  const query = new URLSearchParams()

  if (typeof search === 'string' && search.trim()) {
    query.set('search', search.trim())
  }

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return requestJson(`/companies${suffix}`)
}

export function getCompany(companyId) {
  return requestJson(`/companies/${companyId}`)
}

export function createCompany(data) {
  return requestJson('/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateCompany(companyId, data) {
  return requestJson(`/companies/${companyId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteCompany(companyId) {
  return requestJson(`/companies/${companyId}`, {
    method: 'DELETE',
  })
}

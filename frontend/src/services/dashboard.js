const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function getDashboardMetrics({ role, userId } = {}) {
  const query = new URLSearchParams()

  if (role) query.set('role', role)
  if (Number.isFinite(Number(userId))) query.set('userId', String(userId))

  const response = await fetch(`${API_BASE_URL}/dashboard/metrics?${query.toString()}`)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message ?? 'No se pudieron cargar las metricas del dashboard')
  }

  return payload
}

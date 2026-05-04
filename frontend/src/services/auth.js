const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message ?? 'No se pudo iniciar sesion')
  }

  return payload
}
const SESSION_USER_KEY = 'sessionUser'

export function getSessionUser() {
  const rawUser = sessionStorage.getItem(SESSION_USER_KEY)

  if (!rawUser) return null

  try {
    const parsed = JSON.parse(rawUser)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function saveSessionUser(user) {
  if (!user || typeof user !== 'object') return
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
}

export function clearSessionUser() {
  sessionStorage.removeItem(SESSION_USER_KEY)
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import universityBackdrop from '../../assets/715.jpg'
import campusLogo from '../../assets/Logo santoto camina-02.png'
import { loginUser } from '../../services/auth'
import { getSessionUser, saveSessionUser } from '../../utils/session'

const ROLE_PATHS = {
  COORDINADOR: '/coordinador',
  DOCENTE: '/docente',
  EVALUADOR: '/evaluador',
}

function normalizeRole(rawRole) {
  if (typeof rawRole !== 'string') return ''
  const normalized = rawRole.trim().toUpperCase()
  return ROLE_PATHS[normalized] ? normalized : ''
}

function roleToPath(rawRole) {
  const role = normalizeRole(rawRole)
  return role ? ROLE_PATHS[role] : '/login'
}

function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const currentUser = getSessionUser()
    const destination = roleToPath(currentUser?.role)

    if (currentUser && destination !== '/login') {
      navigate(destination, { replace: true })
    }
  }, [navigate])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function validate() {
    const nextErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = 'El correo es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Ingresa un correo valido'
    }

    if (!form.password) {
      nextErrors.password = 'La contrasena es obligatoria'
    } else if (form.password.length < 6) {
      nextErrors.password = 'Minimo 6 caracteres'
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setStatus({ type: '', message: '' })

    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)

    try {
      const response = await loginUser(form)
      const userRole = normalizeRole(response?.user?.role)

      if (!userRole) {
        throw new Error('Tu cuenta no tiene un rol valido para el dashboard')
      }

      saveSessionUser(response.user)
      navigate(roleToPath(userRole), { replace: true })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo iniciar sesion',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section
        className="login-layout"
        aria-label="Pantalla de inicio de sesion"
        style={{ '--login-backdrop': `url(${universityBackdrop})` }}
      >
        <div className="login-scene" aria-hidden="true">
          <div className="login-orb orb-a" />
          <div className="login-orb orb-b" />
          <div className="login-orb orb-c" />
        </div>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-card">
            <header className="login-header">
              <div className="brands" aria-label="Logos institucionales">
                <img
                  src={campusLogo}
                  alt="Universidad Santo Tomas Campus Virtual"
                  className="brand-logo"
                />
              </div>
              <h1 id="login-title">Iniciar Sesión</h1>
            </header>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {status.message ? (
                <p className={`status-message ${status.type}`} role="status" aria-live="polite">
                  {status.message}
                </p>
              ) : null}

              <label className="field">
                <span>Correo institucional</span>
                <div className="field-control">
                  <input
                    type="email"
                    name="email"
                    placeholder="usuario@usantotomas.edu.co"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email ? <small id="email-error">{errors.email}</small> : null}
              </label>

              <label className="field">
                <span>Contraseña</span>
                <div className="field-control">
                  <input
                    type="password"
                    name="password"
                    placeholder="********"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                </div>
                {errors.password ? (
                  <small id="password-error">{errors.password}</small>
                ) : null}
              </label>

              <div className="login-meta login-meta-single">
                <button type="button" className="link-btn">
                  Olvido su contraseña?
                </button>
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  )
}

export default Login

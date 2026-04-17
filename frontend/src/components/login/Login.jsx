import { useState } from 'react'
import './Login.css'
import loginIllustration from '../../assets/Login.jpg'
import campusLogo from '../../assets/Copia-de-FInal-Logo-campusprueba2-2-1-scaled.png'
import { loginUser } from '../../services/auth'

function Login() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      sessionStorage.setItem('sessionUser', JSON.stringify(response.user))
      setStatus({
        type: 'success',
        message: `Bienvenido, ${response.user.name}.`,
      })
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
      <section className="login-layout" aria-label="Pantalla de inicio de sesion">
        <aside className="login-visual" aria-hidden="true">
          <img src={loginIllustration} alt="" className="visual-image" />
        </aside>

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
              <h1 id="login-title">Iniciar Sesion</h1>
            </header>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {status.message ? (
                <p className={`status-message ${status.type}`} role="status" aria-live="polite">
                  {status.message}
                </p>
              ) : null}

              <label className="field">
                <span>Correo institucional</span>
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
                {errors.email ? <small id="email-error">{errors.email}</small> : null}
              </label>

              <label className="field">
                <span>Contrasena</span>
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
                {errors.password ? (
                  <small id="password-error">{errors.password}</small>
                ) : null}
              </label>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </button>

              <button type="button" className="link-btn">
                Olvido su contrasena?
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  )
}

export default Login

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { createUser } from '../../../../services/users'
import { clearSessionUser } from '../../../../utils/session'
import './CrearUsuario.css'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/coordinador' },
  { label: 'Proyectos', path: '/coordinador' },
  { label: 'Empresas', path: '/coordinador' },
  { label: 'Usuarios', path: '/coordinador/usuarios' },
  { label: 'Reportes', path: '/coordinador' },
]

const ROLE_OPTIONS = [
  { value: 'COORDINADOR', label: 'Coordinador' },
  { value: 'DOCENTE', label: 'Docente' },
  { value: 'EVALUADOR', label: 'Evaluador' },
  { value: 'ESTUDIANTE', label: 'Estudiante' },
]

function CrearUsuario() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOCENTE',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  // Ocultar mensajes después de 3 segundos
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 3000)
      return () => clearTimeout(timeout)
    }
  }, [message])

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(''), 3000)
      return () => clearTimeout(timeout)
    }
  }, [error])

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const payload = await createUser(form)
      setMessage(`Usuario ${payload.user.name} creado correctamente.`)
      setForm((current) => ({
        ...current,
        name: '',
        email: '',
        password: '',
      }))
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="coor-create-page">
      <DashboardNavbar links={NAV_LINKS} onLogout={handleLogout} activeIndex={3} />

      <main className="coor-create-main">
        <section className="coor-create-card">
          <div className="coor-create-head">
            <div>
              <p className="coor-create-eyebrow">Administracion</p>
              <h1>Crear usuario</h1>
              <p>Registra un nuevo usuario para la plataforma LivingLab.</p>
            </div>

            <button type="button" className="coor-create-back" onClick={() => navigate('/coordinador/usuarios')}>
              Volver a usuarios
            </button>
          </div>

          {message ? <div className="coor-create-alert success">{message}</div> : null}
          {error ? <div className="coor-create-alert error">{error}</div> : null}

          <form className="coor-create-form" onSubmit={handleSubmit}>
            <label>
              <span>Nombre</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>

            <label>
              <span>Correo</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>

            <label>
              <span>Contrasena</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                minLength={4}
                required
              />
            </label>

            <label>
              <span>Rol</span>
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default CrearUsuario
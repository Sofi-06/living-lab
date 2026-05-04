import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { COORDINADOR_LINKS } from '../../../../components/navbar/dashboardLinks'
import { getUser, updateUser } from '../../../../services/users'
import { getFirstValidationError, validateUserForm } from '../../../../utils/formValidation'
import { clearSessionUser } from '../../../../utils/session'
import './EditarUsuario.css'

const ROLE_OPTIONS = [
  { value: 'COORDINADOR', label: 'Coordinador' },
  { value: 'PARTICIPANTE', label: 'Participante' },
  { value: 'EVALUADOR', label: 'Evaluador' },
  { value: 'REPRESENTANTE', label: 'Representante' },
]

function EditarUsuario() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'PARTICIPANTE',
    password: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  // Cargar usuario inicial
  useEffect(() => {
    let cancelled = false
    async function loadUser() {
      if (!id) return
      setLoading(true)
      try {
        const payload = await getUser(id)
        if (!cancelled && payload?.user) {
          setForm({
            name: payload.user.name ?? '',
            email: payload.user.email ?? '',
            role: payload.user.role ?? 'PARTICIPANTE',
            password: '',
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el usuario')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    loadUser()
    return () => {
      cancelled = true
    }
  }, [id])

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
    if (!id) return

    const validationErrors = validateUserForm(form, { isEdit: true })

    if (Object.keys(validationErrors).length > 0) {
      setError(getFirstValidationError(validationErrors))
      setMessage('')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await updateUser(id, form)
      navigate('/coordinador/usuarios', { replace: true })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el usuario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="coor-edit-page dashboard-layout-page">
      <DashboardNavbar links={COORDINADOR_LINKS} onLogout={handleLogout} activeIndex={3} />

      <main className="coor-edit-main dashboard-layout-main">
        <section className="coor-edit-card">
          <div className="coor-edit-head">
            <div>
              <p className="coor-edit-eyebrow">Administración</p>
              <h1>Editar usuario</h1>
              <p>Modifica los datos del usuario en la plataforma LivingLab.</p>
            </div>

            <button type="button" className="coor-edit-back" onClick={() => navigate('/coordinador/usuarios')}>
              Volver a usuarios
            </button>
          </div>

          {message ? <div className="coor-edit-alert success">{message}</div> : null}
          {error ? <div className="coor-edit-alert error">{error}</div> : null}

          {loading ? (
            <div style={{ marginTop: '20px' }}>Cargando usuario...</div>
          ) : (
            <form className="coor-edit-form" onSubmit={handleSubmit} noValidate>
              <label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  placeholder=" "
                />
                <span>Nombre</span>
              </label>

              <label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                  placeholder=" "
                />
                <span>Correo</span>
              </label>

              <label>
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                  required
                >
                  <option value="" disabled hidden></option>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span>Rol</span>
              </label>

              <label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  minLength={4}
                  placeholder=" "
                />
                <span>Contraseña (Opcional)</span>
              </label>

              <button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}

export default EditarUsuario

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { getCompany, updateCompany } from '../../../../services/companies'
import { clearSessionUser } from '../../../../utils/session'
import './EditarEmpresa.css'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/coordinador' },
  { label: 'Proyectos', path: '/coordinador/proyectos' },
  { label: 'Empresas', path: '/coordinador/empresas' },
  { label: 'Usuarios', path: '/coordinador/usuarios' },
  { label: 'Reportes', path: '/coordinador' },
]

function EditarEmpresa() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState({
    nombre: '',
    sector: '',
    contacto: '',
    email: '',
    telefono: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    let cancelled = false

    async function loadCompany() {
      if (!id) return
      setLoading(true)

      try {
        const payload = await getCompany(id)

        if (!cancelled && payload?.company) {
          setForm({
            nombre: payload.company.nombre ?? '',
            sector: payload.company.sector ?? '',
            contacto: payload.company.contacto ?? '',
            email: payload.company.email ?? '',
            telefono: payload.company.telefono ?? '',
          })
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la empresa')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCompany()

    return () => {
      cancelled = true
    }
  }, [id])

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

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = await updateCompany(id, form)
      setMessage(`Empresa ${payload.company.nombre} actualizada correctamente.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la empresa')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="coor-edit-company-page">
      <DashboardNavbar links={NAV_LINKS} onLogout={handleLogout} activeIndex={2} />

      <main className="coor-edit-company-main">
        <section className="coor-edit-company-card">
          <div className="coor-edit-company-head">
            <div>
              <p className="coor-edit-company-eyebrow">Administracion</p>
              <h1>Editar empresa</h1>
              <p>Actualiza los datos de la empresa vinculada en LivingLab.</p>
            </div>

            <button type="button" className="coor-edit-company-back" onClick={() => navigate('/coordinador/empresas')}>
              Volver a empresas
            </button>
          </div>

          {message ? <div className="coor-edit-company-alert success">{message}</div> : null}
          {error ? <div className="coor-edit-company-alert error">{error}</div> : null}

          {loading ? (
            <div style={{ marginTop: '20px' }}>Cargando empresa...</div>
          ) : (
            <form className="coor-edit-company-form" onSubmit={handleSubmit}>
              <label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                  required
                  placeholder=" "
                />
                <span>Nombre</span>
              </label>

              <label>
                <input
                  type="text"
                  value={form.sector}
                  onChange={(event) => setForm((current) => ({ ...current, sector: event.target.value }))}
                  required
                  placeholder=" "
                />
                <span>Sector</span>
              </label>

              <label>
                <input
                  type="text"
                  value={form.contacto}
                  onChange={(event) => setForm((current) => ({ ...current, contacto: event.target.value }))}
                  required
                  placeholder=" "
                />
                <span>Contacto</span>
              </label>

              <label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder=" "
                />
                <span>Correo (Opcional)</span>
              </label>

              <label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))}
                  placeholder=" "
                />
                <span>Telefono (Opcional)</span>
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

export default EditarEmpresa

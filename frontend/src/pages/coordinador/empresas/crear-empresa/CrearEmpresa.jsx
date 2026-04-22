import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { createCompany } from '../../../../services/companies'
import { clearSessionUser } from '../../../../utils/session'
import './CrearEmpresa.css'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/coordinador' },
  { label: 'Proyectos', path: '/coordinador/proyectos' },
  { label: 'Empresas', path: '/coordinador/empresas' },
  { label: 'Usuarios', path: '/coordinador/usuarios' },
  { label: 'Reportes', path: '/coordinador' },
]

function CrearEmpresa() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '',
    sector: '',
    contacto: '',
    email: '',
    telefono: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

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
      const payload = await createCompany(form)
      setMessage(`Empresa ${payload.company.nombre} creada correctamente.`)
      setForm({
        nombre: '',
        sector: '',
        contacto: '',
        email: '',
        telefono: '',
      })
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear la empresa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="coor-create-company-page">
      <DashboardNavbar links={NAV_LINKS} onLogout={handleLogout} activeIndex={2} />

      <main className="coor-create-company-main">
        <section className="coor-create-company-card">
          <div className="coor-create-company-head">
            <div>
              <p className="coor-create-company-eyebrow">Administracion</p>
              <h1>Crear empresa</h1>
              <p>Registra una nueva empresa aliada en la plataforma LivingLab.</p>
            </div>

            <button type="button" className="coor-create-company-back" onClick={() => navigate('/coordinador/empresas')}>
              Volver a empresas
            </button>
          </div>

          {message ? <div className="coor-create-company-alert success">{message}</div> : null}
          {error ? <div className="coor-create-company-alert error">{error}</div> : null}

          <form className="coor-create-company-form" onSubmit={handleSubmit}>
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

            <button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear empresa'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default CrearEmpresa

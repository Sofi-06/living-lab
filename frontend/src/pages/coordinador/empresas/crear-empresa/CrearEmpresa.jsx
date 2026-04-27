import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { COORDINADOR_LINKS } from '../../../../components/navbar/dashboardLinks'
import SearchableSelect from '../../../../components/searchable-select/SearchableSelect'
import { createCompany } from '../../../../services/companies'
import { getUsers } from '../../../../services/users'
import { getFirstValidationError, validateCompanyForm } from '../../../../utils/formValidation'
import { clearSessionUser } from '../../../../utils/session'
import './CrearEmpresa.css'

function CrearEmpresa() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '',
    sector: '',
    email: '',
    telefono: '',
    representanteId: '',
  })
  const [representantes, setRepresentantes] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    let cancelled = false

    async function loadRepresentantes() {
      setLoadingOptions(true)

      try {
        const payload = await getUsers('', { role: 'REPRESENTANTE' })

        if (!cancelled) {
          setRepresentantes(payload?.users ?? [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setRepresentantes([])
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la lista de representantes')
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false)
        }
      }
    }

    loadRepresentantes()

    return () => {
      cancelled = true
    }
  }, [])

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
    const validationErrors = validateCompanyForm(form)

    if (Object.keys(validationErrors).length > 0) {
      setError(getFirstValidationError(validationErrors))
      setMessage('')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await createCompany({
        ...form,
        representanteId: Number(form.representanteId),
      })
      navigate('/coordinador/empresas', { replace: true })
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear la empresa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="coor-create-company-page">
      <DashboardNavbar links={COORDINADOR_LINKS} onLogout={handleLogout} activeIndex={2} />

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

          <form className="coor-create-company-form" onSubmit={handleSubmit} noValidate>
            <div className="coor-create-company-form-fields">
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

              <SearchableSelect
                label="Representante de la empresa"
                placeholder="Busca y selecciona un representante"
                options={representantes.map((user) => ({
                  value: String(user.id),
                  label: user.name,
                  description: user.email,
                }))}
                value={form.representanteId}
                onChange={(value) => setForm((current) => ({ ...current, representanteId: value }))}
                emptyMessage="No hay representantes disponibles."
                disabled={loadingOptions}
                required
                variant="line"
              />

              <label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  autoComplete="email"
                  placeholder=" "
                />
                <span>Correo (Opcional)</span>
              </label>

              <label>
                <input
                  type="text"
                  value={form.telefono}
                  inputMode="numeric"
                  maxLength={15}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^0-9]/g, '')
                    setForm((current) => ({ ...current, telefono: value }))
                  }}
                  placeholder=" "
                />
                <span>Telefono (Opcional)</span>
              </label>
            </div>
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

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { COORDINADOR_LINKS } from '../../../../components/navbar/dashboardLinks'
import SearchableSelect from '../../../../components/searchable-select/SearchableSelect'
import { getCompany, updateCompany } from '../../../../services/companies'
import { getUsers } from '../../../../services/users'
import { getFirstValidationError, validateCompanyForm } from '../../../../utils/formValidation'
import { clearSessionUser } from '../../../../utils/session'
import './EditarEmpresa.css'

function EditarEmpresa() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState({
    nombre: '',
    sector: '',
    email: '',
    telefono: '',
    representanteId: '',
  })
  const [representantes, setRepresentantes] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)
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
        const [companyPayload, usersPayload] = await Promise.all([
          getCompany(id),
          getUsers('', { role: 'REPRESENTANTE' }),
        ])

        if (!cancelled && companyPayload?.company) {
          setRepresentantes(usersPayload?.users ?? [])
          setForm({
            nombre: companyPayload.company.nombre ?? '',
            sector: companyPayload.company.sector ?? '',
            email: companyPayload.company.email ?? '',
            telefono: companyPayload.company.telefono ?? '',
            representanteId: String(companyPayload.company.representanteId ?? ''),
          })
        }
      } catch (loadError) {
        if (!cancelled) {
          setRepresentantes([])
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la empresa')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setLoadingOptions(false)
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

    const validationErrors = validateCompanyForm(form)

    if (Object.keys(validationErrors).length > 0) {
      setError(getFirstValidationError(validationErrors))
      setMessage('')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await updateCompany(id, {
        ...form,
        representanteId: Number(form.representanteId),
      })
      navigate('/coordinador/empresas', { replace: true })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la empresa')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="coor-edit-company-page dashboard-layout-page">
      <DashboardNavbar links={COORDINADOR_LINKS} onLogout={handleLogout} activeIndex={2} />

      <main className="coor-edit-company-main dashboard-layout-main">
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
            <form className="coor-edit-company-form" onSubmit={handleSubmit} noValidate>
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

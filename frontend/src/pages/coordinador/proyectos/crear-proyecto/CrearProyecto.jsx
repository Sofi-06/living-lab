import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { getCompanies } from '../../../../services/companies'
import { createProject } from '../../../../services/projects'
import { getUsers } from '../../../../services/users'
import { clearSessionUser } from '../../../../utils/session'
import './CrearProyecto.css'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/coordinador' },
  { label: 'Proyectos', path: '/coordinador/proyectos' },
  { label: 'Empresas', path: '/coordinador/empresas' },
  { label: 'Usuarios', path: '/coordinador/usuarios' },
  { label: 'Reportes', path: '/coordinador' },
]

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function CrearProyecto() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    companyId: '',
    titulo: '',
    descripcionProblema: '',
    resultadoEsperado: '',
    estado: 'PENDING',
    fechaInicio: '',
    fechaFin: '',
    userIds: [],
  })
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
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

    async function loadOptions() {
      setLoading(true)
      setError('')

      try {
        const [companiesPayload, usersPayload] = await Promise.all([
          getCompanies(),
          getUsers(),
        ])

        if (!cancelled) {
          setCompanies(companiesPayload?.companies ?? [])
          setUsers(usersPayload?.users ?? [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setCompanies([])
          setUsers([])
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la informacion del formulario')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadOptions()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!message) return undefined

    const timeout = setTimeout(() => setMessage(''), 3000)
    return () => clearTimeout(timeout)
  }, [message])

  useEffect(() => {
    if (!error) return undefined

    const timeout = setTimeout(() => setError(''), 3000)
    return () => clearTimeout(timeout)
  }, [error])

  const filteredUsers = useMemo(() => {
    const term = normalizeText(userSearch)

    if (!term) return users

    return users.filter((user) => {
      const haystack = `${normalizeText(user.name)} ${normalizeText(user.email)} ${normalizeText(user.role)}`
      return haystack.includes(term)
    })
  }, [userSearch, users])

  function handleToggleUser(userId) {
    setForm((current) => ({
      ...current,
      userIds: current.userIds.includes(userId)
        ? current.userIds.filter((item) => item !== userId)
        : [...current.userIds, userId],
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = await createProject({
        ...form,
        companyId: Number(form.companyId),
      })

      setMessage(`Proyecto ${payload.project.titulo} creado correctamente.`)
      setForm({
        companyId: '',
        titulo: '',
        descripcionProblema: '',
        resultadoEsperado: '',
        estado: 'PENDING',
        fechaInicio: '',
        fechaFin: '',
        userIds: [],
      })
      setUserSearch('')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo crear el proyecto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="coor-project-form-page">
      <DashboardNavbar links={NAV_LINKS} onLogout={handleLogout} activeIndex={1} />

      <main className="coor-project-form-main">
        <section className="coor-project-form-card">
          <div className="coor-project-form-head">
            <div>
              <p className="coor-project-form-eyebrow">Administracion</p>
              <h1>Crear proyecto</h1>
              <p>Relaciona la empresa, define el problema y asigna las personas del proyecto.</p>
            </div>

            <button
              type="button"
              className="coor-project-form-back"
              onClick={() => navigate('/coordinador/proyectos')}
            >
              Volver a proyectos
            </button>
          </div>

          {message ? <div className="coor-project-form-alert success">{message}</div> : null}
          {error ? <div className="coor-project-form-alert error">{error}</div> : null}

          {loading ? (
            <div className="coor-project-form-loading">Cargando formulario...</div>
          ) : (
            <form className="coor-project-form-grid" onSubmit={handleSubmit}>
              <div className="coor-project-form-fields">
                <label>
                  <span>Empresa</span>
                  <select
                    value={form.companyId}
                    onChange={(event) => setForm((current) => ({ ...current, companyId: event.target.value }))}
                    required
                  >
                    <option value="">Selecciona una empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Titulo</span>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  <span>Descripcion del problema</span>
                  <textarea
                    value={form.descripcionProblema}
                    onChange={(event) => setForm((current) => ({ ...current, descripcionProblema: event.target.value }))}
                    required
                    rows={4}
                  />
                </label>

                <label>
                  <span>Resultado esperado</span>
                  <textarea
                    value={form.resultadoEsperado}
                    onChange={(event) => setForm((current) => ({ ...current, resultadoEsperado: event.target.value }))}
                    required
                    rows={4}
                  />
                </label>

                <div className="coor-project-form-row">
                  <label>
                    <span>Estado</span>
                    <select
                      value={form.estado}
                      onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value }))}
                      required
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Fecha inicio</span>
                    <input
                      type="date"
                      value={form.fechaInicio}
                      onChange={(event) => setForm((current) => ({ ...current, fechaInicio: event.target.value }))}
                    />
                  </label>

                  <label>
                    <span>Fecha fin</span>
                    <input
                      type="date"
                      value={form.fechaFin}
                      onChange={(event) => setForm((current) => ({ ...current, fechaFin: event.target.value }))}
                    />
                  </label>
                </div>
              </div>

              <aside className="coor-project-assignment-card">
                <div className="coor-project-assignment-head">
                  <div>
                    <h2>Usuarios asignados</h2>
                    <p>Selecciona una o varias personas para este proyecto.</p>
                  </div>

                  <strong>{form.userIds.length} seleccionados</strong>
                </div>

                <input
                  type="search"
                  className="coor-project-user-search"
                  placeholder="Buscar usuario por nombre, correo o rol"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                />

                <div className="coor-project-user-list">
                  {filteredUsers.map((user) => (
                    <label key={user.id} className="coor-project-user-option">
                      <input
                        type="checkbox"
                        checked={form.userIds.includes(user.id)}
                        onChange={() => handleToggleUser(user.id)}
                      />
                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                        <small>{user.role}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </aside>

              <button type="submit" className="coor-project-submit" disabled={saving}>
                {saving ? 'Creando...' : 'Crear proyecto'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}

export default CrearProyecto

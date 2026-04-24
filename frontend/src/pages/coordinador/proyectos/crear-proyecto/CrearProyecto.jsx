import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar, { COORDINADOR_LINKS } from '../../../../components/navbar/DashboardNavbar'
import SearchableSelect from '../../../../components/searchable-select/SearchableSelect'
import { getCompanies } from '../../../../services/companies'
import { createProject } from '../../../../services/projects'
import { getUsers } from '../../../../services/users'
import { clearSessionUser } from '../../../../utils/session'
import './CrearProyecto.css'

function CrearProyecto() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    companyId: '',
    participanteId: '',
    evaluadorId: '',
    titulo: '',
    descripcionProblema: '',
    resultadoEsperado: '',
    fechaInicio: '',
    fechaFin: '',
  })
  const [companies, setCompanies] = useState([])
  const [participantes, setParticipantes] = useState([])
  const [evaluadores, setEvaluadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedCompany = companies.find((company) => String(company.id) === form.companyId) ?? null
  const selectedParticipante =
    participantes.find((user) => String(user.id) === form.participanteId) ?? null
  const selectedEvaluador =
    evaluadores.find((user) => String(user.id) === form.evaluadorId) ?? null

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
        const [companiesPayload, participantesPayload, evaluadoresPayload] = await Promise.all([
          getCompanies(),
          getUsers('', { role: 'PARTICIPANTE' }),
          getUsers('', { role: 'EVALUADOR' }),
        ])

        if (!cancelled) {
          setCompanies(companiesPayload?.companies ?? [])
          setParticipantes(participantesPayload?.users ?? [])
          setEvaluadores(evaluadoresPayload?.users ?? [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setCompanies([])
          setParticipantes([])
          setEvaluadores([])
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

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await createProject({
        ...form,
        companyId: Number(form.companyId),
        participanteId: Number(form.participanteId),
        evaluadorId: Number(form.evaluadorId),
      })
      navigate('/coordinador/proyectos', { replace: true })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo crear el proyecto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="coor-project-form-page">
      <DashboardNavbar links={COORDINADOR_LINKS} onLogout={handleLogout} activeIndex={1} />

      <main className="coor-project-form-main">
        <section className="coor-project-form-card">
          <div className="coor-project-form-head">
            <div>
              <p className="coor-project-form-eyebrow">Administracion</p>
              <h1>Crear proyecto</h1>
              <p>Selecciona la empresa, revisa su representante y asigna participante y evaluador.</p>
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
                <SearchableSelect
                  label="Empresa"
                  placeholder="Busca y selecciona una empresa"
                  options={companies.map((company) => ({
                    value: String(company.id),
                    label: company.nombre,
                    description: company.representante?.name
                      ? `Representante: ${company.representante.name}`
                      : company.sector,
                  }))}
                  value={form.companyId}
                  onChange={(value) => setForm((current) => ({ ...current, companyId: value }))}
                  emptyMessage="No hay empresas disponibles."
                  required
                  variant="line"
                />

                <label className={selectedCompany?.representante?.name ? 'is-filled' : ''}>
                  <input
                    type="text"
                    value={selectedCompany?.representante?.name ?? ''}
                    readOnly
                    placeholder=" "
                  />
                  <span>Representante</span>
                </label>

                <label className={form.titulo ? 'is-filled' : ''}>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))}
                    required
                    placeholder=" "
                  />
                  <span>Titulo</span>
                </label>

                <label className={form.descripcionProblema ? 'is-filled' : ''}>
                  <textarea
                    value={form.descripcionProblema}
                    onChange={(event) => setForm((current) => ({ ...current, descripcionProblema: event.target.value }))}
                    required
                    rows={4}
                    placeholder=" "
                  />
                  <span>Descripcion del problema</span>
                </label>

                <label className={form.resultadoEsperado ? 'is-filled' : ''}>
                  <textarea
                    value={form.resultadoEsperado}
                    onChange={(event) => setForm((current) => ({ ...current, resultadoEsperado: event.target.value }))}
                    required
                    rows={4}
                    placeholder=" "
                  />
                  <span>Resultado esperado</span>
                </label>

                <div className="coor-project-form-row">
                  <label className={form.fechaInicio ? 'is-filled date-field' : 'date-field'}>
                    <input
                      type="date"
                      value={form.fechaInicio}
                      onChange={(event) => setForm((current) => ({ ...current, fechaInicio: event.target.value }))}
                    />
                    <span>Fecha inicio</span>
                  </label>

                  <label className={form.fechaFin ? 'is-filled date-field' : 'date-field'}>
                    <input
                      type="date"
                      value={form.fechaFin}
                      onChange={(event) => setForm((current) => ({ ...current, fechaFin: event.target.value }))}
                    />
                    <span>Fecha fin</span>
                  </label>
                </div>

                <SearchableSelect
                  label="Participante"
                  placeholder="Busca y selecciona un participante"
                  options={participantes.map((user) => ({
                    value: String(user.id),
                    label: user.name,
                    description: user.email,
                  }))}
                  value={form.participanteId}
                  onChange={(value) => setForm((current) => ({ ...current, participanteId: value }))}
                  emptyMessage="No hay participantes disponibles."
                  required
                  variant="line"
                />

                <SearchableSelect
                  label="Evaluador"
                  placeholder="Busca y selecciona un evaluador"
                  options={evaluadores.map((user) => ({
                    value: String(user.id),
                    label: user.name,
                    description: user.email,
                  }))}
                  value={form.evaluadorId}
                  onChange={(value) => setForm((current) => ({ ...current, evaluadorId: value }))}
                  emptyMessage="No hay evaluadores disponibles."
                  required
                  variant="line"
                />
              </div>

              <aside className="coor-project-assignment-card">
                <div className="coor-project-assignment-head">
                  <div>
                    <h2>Resumen de asignacion</h2>
                    <p>El estado inicial se registra automaticamente como pendiente.</p>
                  </div>
                </div>

                <div className="coor-project-summary-list">
                  <div className="coor-project-summary-item">
                    <span>Empresa</span>
                    <strong>{selectedCompany?.nombre ?? 'Sin seleccionar'}</strong>
                  </div>

                  <div className="coor-project-summary-item">
                    <span>Representante</span>
                    <strong>{selectedCompany?.representante?.name ?? 'Sin seleccionar empresa'}</strong>
                    <small>{selectedCompany?.representante?.email ?? ''}</small>
                  </div>

                  <div className="coor-project-summary-item">
                    <span>Participante</span>
                    <strong>{selectedParticipante?.name ?? 'Sin seleccionar'}</strong>
                    <small>{selectedParticipante?.email ?? ''}</small>
                  </div>

                  <div className="coor-project-summary-item">
                    <span>Evaluador</span>
                    <strong>{selectedEvaluador?.name ?? 'Sin seleccionar'}</strong>
                    <small>{selectedEvaluador?.email ?? ''}</small>
                  </div>
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

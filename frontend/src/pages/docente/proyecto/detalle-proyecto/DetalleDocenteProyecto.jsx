import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { createProjectEvidence, getProject } from '../../../../services/projects'
import { clearSessionUser, getSessionUser } from '../../../../utils/session'
import '../../../coordinador/proyectos/detalle-proyecto/DetalleProyecto.css'
import './DetalleDocenteProyecto.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/docente' },
  { label: 'Proyectos', path: '/docente/proyectos' },
]

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
}

const PHASE_STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  IN_REVIEW: 'En revision',
  COMPLETED: 'Completada',
}

const EVIDENCE_STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_REVIEW: 'En revision',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

const TAB_OPTIONS = [
  { id: 'informacion', label: 'Informacion' },
  { id: 'fases', label: 'Fases' },
  { id: 'evidencias', label: 'Evidencias' },
]

const DEFAULT_PHASES = [
  'Co-creacion',
  'Accion',
  'Medicion',
  'Iteracion',
  'Narrativa',
  'Apropiacion',
]

const EMPTY_EVIDENCE_FORM = {
  projectPhaseId: '',
  titulo: '',
  descripcion: '',
  archivo: null,
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function resolveEvidenceUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '#'
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `${API_BASE_URL}${value}`
}

function DetalleDocenteProyecto() {
  const navigate = useNavigate()
  const { id } = useParams()
  const sessionUser = getSessionUser()
  const [project, setProject] = useState(null)
  const [activeTab, setActiveTab] = useState('informacion')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [savingEvidence, setSavingEvidence] = useState(false)
  const [evidenceForm, setEvidenceForm] = useState(EMPTY_EVIDENCE_FORM)

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      if (!id) return

      setLoading(true)
      setError('')

      try {
        const payload = await getProject(id)
        const nextProject = payload?.project ?? null
        const isAssigned = (nextProject?.users ?? []).some((user) => user.id === sessionUser?.id)

        if (!cancelled) {
          if (!isAssigned) {
            setProject(null)
            setError('Este proyecto no esta asignado a tu usuario.')
          } else {
            setProject(nextProject)
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setProject(null)
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el detalle del proyecto')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProject()

    return () => {
      cancelled = true
    }
  }, [id, sessionUser?.id])

  useEffect(() => {
    if (!saveMessage) return undefined

    const timeout = setTimeout(() => setSaveMessage(''), 3000)
    return () => clearTimeout(timeout)
  }, [saveMessage])

  const phases = useMemo(() => {
    const currentPhases = project?.phases ?? []
    const indexedPhases = new Map(currentPhases.map((phase) => [normalizeText(phase.nombre), phase]))

    return DEFAULT_PHASES.map((phaseName) => {
      const foundPhase = indexedPhases.get(normalizeText(phaseName))

      return foundPhase ?? {
        id: phaseName,
        nombre: phaseName,
        estado: 'PENDING',
        observaciones: null,
      }
    })
  }, [project])

  function handleEvidenceFieldChange(event) {
    const { name, value, files } = event.target
    const nextValue = name === 'archivo' ? files?.[0] ?? null : value
    setEvidenceForm((current) => ({ ...current, [name]: nextValue }))
  }

  async function handleEvidenceSubmit(event) {
    event.preventDefault()

    if (!id || !sessionUser?.id) return

    setSavingEvidence(true)
    setSaveMessage('')
    setError('')

    try {
      const payload = await createProjectEvidence(id, {
        ...evidenceForm,
        userId: sessionUser.id,
      })

      setProject((current) => {
        if (!current) return current

        return {
          ...current,
          evidences: [payload.evidence, ...(current.evidences ?? [])],
        }
      })
      setEvidenceForm(EMPTY_EVIDENCE_FORM)
      setSaveMessage('Evidencia registrada correctamente.')
      setActiveTab('evidencias')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo registrar la evidencia')
    } finally {
      setSavingEvidence(false)
    }
  }

  function renderInformationTab() {
    return (
      <section className="coor-project-detail-section">
        <div className="coor-project-detail-grid">
          <div className="coor-project-detail-block">
            <span className="coor-project-detail-label">Titulo</span>
            <strong>{project?.titulo}</strong>
          </div>

          <div className="coor-project-detail-block">
            <span className="coor-project-detail-label">Empresa</span>
            <strong>{project?.company?.nombre}</strong>
          </div>

          <div className="coor-project-detail-block">
            <span className="coor-project-detail-label">Estado</span>
            <strong>{STATUS_LABELS[project?.estado] ?? project?.estado}</strong>
          </div>

          <div className="coor-project-detail-block">
            <span className="coor-project-detail-label">Fechas</span>
            <strong>{formatDate(project?.fechaInicio)} - {formatDate(project?.fechaFin)}</strong>
          </div>
        </div>

        <div className="coor-project-detail-copy-grid">
          <article className="coor-project-detail-copy-card">
            <span className="coor-project-detail-label">Problema</span>
            <p>{project?.descripcionProblema || '-'}</p>
          </article>

          <article className="coor-project-detail-copy-card">
            <span className="coor-project-detail-label">Resultado esperado</span>
            <p>{project?.resultadoEsperado || '-'}</p>
          </article>
        </div>
      </section>
    )
  }

  function renderPhasesTab() {
    return (
      <section className="coor-project-detail-section">
        <div className="coor-project-detail-table-wrap">
          <table className="coor-project-detail-table">
            <thead>
              <tr>
                <th>Fase</th>
                <th>Estado</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((phase) => (
                <tr key={phase.id}>
                  <td>{phase.nombre}</td>
                  <td>
                    <span className={`coor-project-detail-badge ${normalizeText(phase.estado)}`}>
                      {PHASE_STATUS_LABELS[phase.estado] ?? phase.estado}
                    </span>
                  </td>
                  <td>{phase.observaciones || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  function renderEvidencesTab() {
    const evidences = project?.evidences ?? []

    return (
      <section className="coor-project-detail-section">
        <article className="coor-project-detail-panel">
          <div className="coor-project-detail-panel-head">
            <h3>Subir evidencia</h3>
            <p>Registra el enlace del archivo y relaciona la evidencia con una fase del proyecto.</p>
          </div>

          <form className="doc-evidence-form" onSubmit={handleEvidenceSubmit}>
            <label className="doc-evidence-field">
              <span>Fase</span>
              <select
                name="projectPhaseId"
                value={evidenceForm.projectPhaseId}
                onChange={handleEvidenceFieldChange}
                required
              >
                <option value="">Selecciona una fase</option>
                {(project?.phases ?? []).map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="doc-evidence-field">
              <span>Titulo</span>
              <input
                type="text"
                name="titulo"
                value={evidenceForm.titulo}
                onChange={handleEvidenceFieldChange}
                placeholder="Ej. Informe de avance"
                required
              />
            </label>

            <label className="doc-evidence-field doc-evidence-field-full">
              <span>Descripcion</span>
              <textarea
                name="descripcion"
                value={evidenceForm.descripcion}
                onChange={handleEvidenceFieldChange}
                placeholder="Describe brevemente la evidencia"
                rows="3"
              />
            </label>

            <label className="doc-evidence-field doc-evidence-field-full">
              <span>Archivo</span>
              <input
                type="file"
                name="archivo"
                onChange={handleEvidenceFieldChange}
                required
              />
            </label>

            <div className="coor-project-detail-actions-strip">
              <button type="submit" className="coor-project-detail-primary" disabled={savingEvidence}>
                {savingEvidence ? 'Guardando...' : 'Registrar evidencia'}
              </button>
            </div>
          </form>
        </article>

        <article className="coor-project-detail-panel">
          <div className="coor-project-detail-panel-head">
            <h3>Evidencias registradas</h3>
            <p>Consulta el historial de entregas asociadas a este proyecto.</p>
          </div>

          {evidences.length === 0 ? (
            <div className="coor-project-detail-empty">Aun no hay evidencias registradas para este proyecto.</div>
          ) : (
            <div className="coor-project-detail-table-wrap">
              <table className="coor-project-detail-table">
                <thead>
                  <tr>
                    <th>Fase</th>
                    <th>Titulo</th>
                    <th>Usuario</th>
                    <th>Estado</th>
                    <th>Archivo</th>
                  </tr>
                </thead>
                <tbody>
                  {evidences.map((evidence) => (
                    <tr key={evidence.id}>
                      <td>{evidence.fase}</td>
                      <td>{evidence.titulo}</td>
                      <td>{evidence.user?.name ?? '-'}</td>
                      <td>
                        <span className={`coor-project-detail-badge ${normalizeText(evidence.estado)}`}>
                          {EVIDENCE_STATUS_LABELS[evidence.estado] ?? evidence.estado}
                        </span>
                      </td>
                      <td>
                        <a
                          href={resolveEvidenceUrl(evidence.archivo)}
                          target="_blank"
                          rel="noreferrer"
                          className="coor-project-detail-link"
                        >
                          Ver archivo
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    )
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'fases':
        return renderPhasesTab()
      case 'evidencias':
        return renderEvidencesTab()
      default:
        return renderInformationTab()
    }
  }

  return (
    <div className="coor-project-detail-page">
      <DashboardNavbar links={NAV_LINKS} onLogout={handleLogout} activeIndex={1} />

      <main className="coor-project-detail-main">
        {loading ? (
          <section className="coor-project-detail-shell">
            <div className="coor-project-detail-empty">Cargando proyecto...</div>
          </section>
        ) : error ? (
          <section className="coor-project-detail-shell">
            <div className="coor-project-detail-error">{error}</div>
          </section>
        ) : (
          <>
            <section className="coor-project-detail-hero">
              <div>
                <p className="coor-project-detail-eyebrow">Proyecto asignado</p>
                <h1>{project?.titulo}</h1>
                <div className="coor-project-detail-summary">
                  <span>Empresa: {project?.company?.nombre || '-'}</span>
                </div>
              </div>
              <div className="coor-project-detail-hero-actions">
                <button
                  type="button"
                  className="coor-project-detail-outline"
                  onClick={() => navigate('/docente/proyectos')}
                >
                  Volver a proyectos
                </button>
              </div>
            </section>

            <section className="coor-project-detail-shell">
              {saveMessage ? <div className="doc-evidence-success">{saveMessage}</div> : null}

              <div className="coor-project-detail-tabs">
                {TAB_OPTIONS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={tab.id === activeTab ? 'coor-project-detail-tab active' : 'coor-project-detail-tab'}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="coor-project-detail-content">
                {renderTabContent()}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default DetalleDocenteProyecto

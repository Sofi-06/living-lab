import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { createProjectEvidence, getProject } from '../../../../services/projects'
import {
  EVIDENCE_STATUS_LABELS,
  PHASE_STATUS_LABELS,
  ensureProjectPhases,
  getCurrentProjectPhase,
  getPhaseFlowLabel,
  getPhaseFlowTone,
  getProjectProgress,
  normalizeText,
} from '../../../../utils/projectPhases'
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

const TAB_OPTIONS = [
  { id: 'informacion', label: 'Informacion' },
  { id: 'fases', label: 'Fases' },
  { id: 'evidencias', label: 'Evidencias' },
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
        const isAssigned = nextProject?.participante?.id === sessionUser?.id

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
    return ensureProjectPhases(project)
  }, [project])

  const currentPhase = useMemo(() => getCurrentProjectPhase(project, phases), [project, phases])
  const progress = useMemo(() => getProjectProgress(project, phases), [project, phases])

  const phaseChecklistMap = useMemo(() => {
    return new Map((project?.phaseChecklist ?? []).map((phaseEntry) => [normalizeText(phaseEntry.fase), phaseEntry]))
  }, [project])

  function handleEvidenceFieldChange(event) {
    const { name, value, files } = event.target
    const nextValue = name === 'archivo' ? files?.[0] ?? null : value
    setEvidenceForm((current) => ({ ...current, [name]: nextValue }))
  }

  async function handleEvidenceSubmit(event) {
    event.preventDefault()

    if (!id || !sessionUser?.id || !currentPhase?.id) return

    setSavingEvidence(true)
    setSaveMessage('')
    setError('')

    try {
      await createProjectEvidence(id, {
        ...evidenceForm,
        projectPhaseId: currentPhase.id,
        userId: sessionUser.id,
      })
      const refreshedPayload = await getProject(id)
      const refreshedProject = refreshedPayload?.project ?? null
      const isAssigned = refreshedProject?.participante?.id === sessionUser?.id

      setProject(isAssigned ? refreshedProject : null)
      setEvidenceForm(EMPTY_EVIDENCE_FORM)
      setSaveMessage('Evidencia registrada correctamente.')
      setActiveTab('evidencias')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo registrar la evidencia')
    } finally {
      setSavingEvidence(false)
    }
  }

  function renderProgressOverview() {
    return (
      <section className="coor-project-detail-progress-grid">
        <article className="coor-project-detail-progress-card">
          <span className="coor-project-detail-mini-label">Progreso general</span>
          <div className="coor-project-detail-progress-head">
            <div>
              <h3>{currentPhase ? `Fase actual: ${currentPhase.nombre}` : 'Proyecto finalizado'}</h3>
              <p>
                {progress.completedPhases} de {progress.totalPhases} fases completadas en la ruta del proyecto.
              </p>
            </div>
            <div className="coor-project-detail-progress-meter">
              <strong className="coor-project-detail-progress-value">{progress.percentage}%</strong>
              <span className="coor-project-detail-progress-label">Completado</span>
            </div>
          </div>

          <div className="coor-project-detail-progress-bar" aria-hidden="true">
            <div
              className="coor-project-detail-progress-fill"
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
            />
          </div>

          <div className="coor-project-detail-progress-meta">
            <div className="coor-project-detail-progress-meta-item">
              <span>Fase actual</span>
              <strong>{currentPhase?.nombre ?? 'Proyecto finalizado'}</strong>
            </div>
            <div className="coor-project-detail-progress-meta-item">
              <span>Estado actual</span>
              <strong>{currentPhase ? PHASE_STATUS_LABELS[currentPhase.estado] ?? currentPhase.estado : 'Completado'}</strong>
            </div>
            <div className="coor-project-detail-progress-meta-item">
              <span>Fases completadas</span>
              <strong>{progress.completedPhases}</strong>
            </div>
            <div className="coor-project-detail-progress-meta-item">
              <span>Fases bloqueadas</span>
              <strong>{phases.filter((phase) => phase.isLocked).length}</strong>
            </div>
          </div>
        </article>
      </section>
    )
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

        <article className="coor-project-detail-copy-card">
          <span className="coor-project-detail-label">Equipo del proyecto</span>
          <div className="coor-project-detail-users">
            <span className="coor-project-detail-chip">
              Participante: {project?.participante?.name ?? '-'}
            </span>
            <span className="coor-project-detail-chip">
              Evaluador: {project?.evaluador?.name ?? '-'}
            </span>
          </div>
        </article>
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
                <th>Orden</th>
                <th>Fase</th>
                <th>Flujo</th>
                <th>Estado</th>
                <th>Evidencias</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((phase) => (
                <tr key={phase.id}>
                  <td>F{phase.orden}</td>
                  <td>{phase.nombre}</td>
                  <td>
                    <span className={`coor-project-detail-flow-badge ${getPhaseFlowTone(phase)}`}>
                      {getPhaseFlowLabel(phase)}
                    </span>
                  </td>
                  <td>
                    <span className={`coor-project-detail-badge ${normalizeText(phase.estado)}`}>
                      {PHASE_STATUS_LABELS[phase.estado] ?? phase.estado}
                    </span>
                  </td>
                  <td>{phase.evidenceCount}</td>
                  <td>{phase.observaciones || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <article className="coor-project-detail-evaluation-card">
          <h3>Retroalimentacion del evaluador</h3>
          <p>Aqui puedes consultar observaciones y checklist diligenciados para cada fase revisada.</p>

          {phases.some((phase) => {
            const phaseChecklist = phaseChecklistMap.get(normalizeText(phase.nombre))
            return Boolean(phase.observaciones) || (phaseChecklist?.items?.length ?? 0) > 0
          }) ? (
            <div className="coor-project-detail-evaluation-list">
              {phases.map((phase) => {
                const phaseChecklist = phaseChecklistMap.get(normalizeText(phase.nombre))
                const hasEvaluation = Boolean(phase.observaciones) || (phaseChecklist?.items?.length ?? 0) > 0

                if (!hasEvaluation) return null

                return (
                  <article key={phase.id} className="coor-project-detail-evaluation-item">
                    <div className="coor-project-detail-evaluation-item-head">
                      <strong>{phase.nombre}</strong>
                      <span className={`coor-project-detail-flow-badge ${getPhaseFlowTone(phase)}`}>
                        {getPhaseFlowLabel(phase)}
                      </span>
                    </div>

                    <p className="coor-project-detail-evaluation-item-copy">
                      {phase.observaciones || 'Sin observaciones registradas.'}
                    </p>

                    {(phaseChecklist?.items?.length ?? 0) > 0 ? (
                      <div className="coor-project-detail-table-wrap">
                        <table className="coor-project-detail-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Resultado</th>
                              <th>Observacion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {phaseChecklist.items.map((item) => (
                              <tr key={item.id}>
                                <td>{item.item}</td>
                                <td>{item.resultado}</td>
                                <td>{item.observacion || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="coor-project-detail-empty">Aun no hay retroalimentacion registrada por fase.</div>
          )}
        </article>
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
            <p>Solo puedes registrar evidencia en la fase actual habilitada por el sistema.</p>
          </div>

          <form className="doc-evidence-form" onSubmit={handleEvidenceSubmit}>
            <label className="doc-evidence-field">
              <span>Fase</span>
              <select
                name="projectPhaseId"
                value={currentPhase?.id ?? ''}
                disabled
                required
              >
                <option value={currentPhase?.id ?? ''}>
                  {currentPhase?.nombre ?? 'No hay fase disponible'}
                </option>
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
              <div className="custom-file-input-wrapper">
                <input
                  id="custom-evidence-file"
                  type="file"
                  name="archivo"
                  style={{ display: 'none' }}
                  onChange={handleEvidenceFieldChange}
                  required
                />
                <button
                  type="button"
                  className="custom-file-btn"
                  onClick={() => document.getElementById('custom-evidence-file').click()}
                >
                  Seleccionar archivo
                </button>
                <span className="custom-file-name">
                  {evidenceForm.archivo ? evidenceForm.archivo.name : 'Sin archivos seleccionados'}
                </span>
              </div>
            </label>

            <div className="coor-project-detail-actions-strip">
              <button
                type="submit"
                className="coor-project-detail-primary"
                disabled={savingEvidence || !currentPhase?.id}
              >
                {savingEvidence ? 'Guardando...' : 'Registrar evidencia'}
              </button>
            </div>
          </form>

          {currentPhase?.observaciones ? (
            <div className="doc-evidence-note">
              <strong>Observaciones del evaluador:</strong> {currentPhase.observaciones}
            </div>
          ) : null}
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
                    <th>Observaciones</th>
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
                      <td>{evidence.observaciones || '-'}</td>
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
                  <span>Representante: {project?.company?.representante?.name || '-'}</span>
                  <span>Fase actual: {currentPhase?.nombre ?? 'Proyecto finalizado'}</span>
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

            <section className="coor-project-detail-shell coor-project-detail-shell-summary">
              {renderProgressOverview()}
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

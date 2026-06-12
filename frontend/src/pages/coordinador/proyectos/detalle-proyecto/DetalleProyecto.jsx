import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { COORDINADOR_LINKS } from '../../../../components/navbar/dashboardLinks'
import { deleteProjectEvidence, getProject } from '../../../../services/projects'
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
import { DeleteIcon } from '../../../../components/icons/ActionIcons'
import { clearSessionUser, getSessionUser } from '../../../../utils/session'
import './DetalleProyecto.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
}

const TAB_OPTIONS = [
  { id: 'informacion', label: 'Información' },
  { id: 'fases', label: 'Fases' },
  { id: 'evidencias', label: 'Evidencias' },
  { id: 'evaluacion', label: 'Evaluación' },
]

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

function DetalleProyecto() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [activeTab, setActiveTab] = useState('informacion')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const sessionUser = getSessionUser()

  async function handleDeleteEvidence(evidenceId) {
    if (!globalThis.confirm('¿Estás seguro de eliminar esta evidencia? Esta acción no se puede deshacer.')) return

    try {
      await deleteProjectEvidence(id, evidenceId, sessionUser?.id)
      const refreshedPayload = await getProject(id)
      setProject(refreshedPayload?.project ?? null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la evidencia')
    }
  }

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

        if (!cancelled) {
          setProject(payload?.project ?? null)
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
  }, [id])

  const phases = useMemo(() => {
    return ensureProjectPhases(project)
  }, [project])

  const currentPhase = useMemo(() => getCurrentProjectPhase(project, phases), [project, phases])
  const progress = useMemo(() => getProjectProgress(project, phases), [project, phases])

  const phaseChecklistMap = useMemo(() => {
    return new Map((project?.phaseChecklist ?? []).map((phaseEntry) => [normalizeText(phaseEntry.fase), phaseEntry]))
  }, [project])

  const evaluatedPhases = useMemo(() => {
    return phases.filter((phase) => {
      const phaseChecklist = phaseChecklistMap.get(normalizeText(phase.nombre))
      return Boolean(phase.observaciones) || (phaseChecklist?.items?.length ?? 0) > 0
    })
  }, [phaseChecklistMap, phases])

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
            <span className="coor-project-detail-label">Título</span>
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
          <span className="coor-project-detail-label">Responsables</span>
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
      </section>
    )
  }

  function renderEvidencesTab() {
    const evidences = project?.evidences ?? []

    if (evidences.length === 0) {
      return <div className="coor-project-detail-empty">Aún no hay evidencias registradas para este proyecto.</div>
    }

    return (
      <section className="coor-project-detail-section">
        <div className="coor-project-detail-actions-strip">
          <button
            type="button"
            className="coor-project-detail-outline"
            onClick={() => navigate(`/coordinador/proyectos/editar-proyecto/${project?.id}`)}
          >
            Subir evidencia
          </button>
        </div>

        <div className="coor-project-detail-table-wrap">
          <table className="coor-project-detail-table">
            <thead>
              <tr>
                <th>Fase</th>
                <th>Título</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Archivo</th>
                <th>Acciones</th>
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
                  <td>
                    <button
                      type="button"
                      className="evidence-delete-btn"
                      onClick={() => handleDeleteEvidence(evidence.id)}
                      aria-label={`Eliminar evidencia ${evidence.titulo}`}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  function renderEvaluationTab() {
    return (
      <section className="coor-project-detail-section">
        <article className="coor-project-detail-evaluation-card">
          <h3>Evaluaciones por fase</h3>
          <p>Consulta observaciones y checklist diligenciados por el evaluador en cada fase del proyecto.</p>

          {evaluatedPhases.length === 0 ? (
            <div className="coor-project-detail-empty">Aún no hay evaluaciones registradas por fase.</div>
          ) : (
            <div className="coor-project-detail-evaluation-list">
              {evaluatedPhases.map((phase) => {
                const phaseChecklist = phaseChecklistMap.get(normalizeText(phase.nombre))

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
                              <th>Observación</th>
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
      case 'evaluacion':
        return renderEvaluationTab()
      default:
        return renderInformationTab()
    }
  }

  return (
    <div className="coor-project-detail-page dashboard-layout-page">
      <DashboardNavbar links={COORDINADOR_LINKS} onLogout={handleLogout} activeIndex={1} />

      <main className="coor-project-detail-main dashboard-layout-main">
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
                <p className="coor-project-detail-eyebrow">Proyecto</p>
                <h1>{project?.titulo}</h1>
                <div className="coor-project-detail-summary">
                  <span>Empresa: {project?.company?.nombre || '-'}</span>
                  <span>Representante: {project?.company?.representante?.name || '-'}</span>
                </div>
              </div>
              <div className="coor-project-detail-hero-actions">
                <button
                  type="button"
                  className="coor-project-detail-outline"
                  onClick={() => navigate('/coordinador/proyectos')}
                >
                  Volver a proyectos
                </button>
              </div>
            </section>

            <section className="coor-project-detail-shell coor-project-detail-shell-summary">
              {renderProgressOverview()}
            </section>

            <section className="coor-project-detail-shell">
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

export default DetalleProyecto

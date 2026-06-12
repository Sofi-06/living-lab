import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { createProjectEvidence, deleteProjectEvidence, getProject } from '../../../../services/projects'
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
import { getFirstValidationError, validateEvidenceForm } from '../../../../utils/formValidation'
import { DeleteIcon } from '../../../../components/icons/ActionIcons'
import { clearSessionUser, getSessionUser } from '../../../../utils/session'
import '../../../coordinador/proyectos/detalle-proyecto/DetalleProyecto.css'
import './DetalleParticipanteProyecto.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/participante' },
  { label: 'Proyectos', path: '/participante/proyectos' },
]

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
  { id: 'validacion', label: 'Validación empresarial' },
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

const IMAGE_FILE_REGEX = /\.(png|jpe?g|gif|webp|bmp|svg)$/i

function resolveEvidenceUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '#'
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `${API_BASE_URL}${value}`
}

function isImageAsset(value) {
  return typeof value === 'string' && IMAGE_FILE_REGEX.test(value.split('?')[0] ?? '')
}

function DetalleParticipanteProyecto() {
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
            setError('Este proyecto no está asignado a tu usuario.')
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

  const phases = useMemo(() => ensureProjectPhases(project), [project])
  const currentPhase = useMemo(() => getCurrentProjectPhase(project, phases), [project, phases])
  const progress = useMemo(() => getProjectProgress(project, phases), [project, phases])
  const isProjectExpired = Boolean(project?.fechaFin && new Date() > new Date(project.fechaFin))

  const phaseChecklistMap = useMemo(
    () => new Map((project?.phaseChecklist ?? []).map((phaseEntry) => [normalizeText(phaseEntry.fase), phaseEntry])),
    [project],
  )

  function handleEvidenceFieldChange(event) {
    const { name, value, files } = event.target
    const nextValue = name === 'archivo' ? files?.[0] ?? null : value
    setEvidenceForm((current) => ({ ...current, [name]: nextValue }))
  }

  async function handleEvidenceSubmit(event) {
    event.preventDefault()

    if (!id || !sessionUser?.id || !currentPhase?.id) return

    const validationErrors = validateEvidenceForm(evidenceForm, {
      currentPhaseId: currentPhase.id,
      isProjectExpired,
    })

    if (Object.keys(validationErrors).length > 0) {
      setError(getFirstValidationError(validationErrors))
      setSaveMessage('')
      return
    }

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

  async function handleDeleteEvidence(evidenceId) {
    if (!globalThis.confirm('¿Estás seguro de eliminar esta evidencia? Esta acción no se puede deshacer.')) return

    setSaveMessage('')
    setError('')

    try {
      await deleteProjectEvidence(id, evidenceId, sessionUser.id)
      const refreshedPayload = await getProject(id)
      const refreshedProject = refreshedPayload?.project ?? null
      const isAssigned = refreshedProject?.participante?.id === sessionUser?.id

      setProject(isAssigned ? refreshedProject : null)
      setSaveMessage('Evidencia eliminada correctamente.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la evidencia')
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
          <span className="coor-project-detail-label">Equipo del proyecto</span>
          <div className="coor-project-detail-users">
            <span className="coor-project-detail-chip">Participante: {project?.participante?.name ?? '-'}</span>
            <span className="coor-project-detail-chip">Evaluador: {project?.evaluador?.name ?? '-'}</span>
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
          <h3>Retroalimentación del evaluador</h3>
          <p>Aquí puedes consultar observaciones y checklist diligenciados para cada fase revisada.</p>

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
            <div className="coor-project-detail-empty">Aún no hay retroalimentación registrada por fase.</div>
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

          {isProjectExpired ? (
            <div className="coor-project-detail-alert error">
              <strong>Proyecto vencido:</strong> La fecha de finalización del proyecto ({formatDate(project?.fechaFin)}) ya ha pasado. No es posible registrar nuevas evidencias.
            </div>
          ) : null}

          <form className="doc-evidence-form" onSubmit={handleEvidenceSubmit} noValidate style={isProjectExpired ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
            <label className="doc-evidence-field">
              <span>Fase</span>
              <select name="projectPhaseId" value={currentPhase?.id ?? ''} disabled required>
                <option value={currentPhase?.id ?? ''}>{currentPhase?.nombre ?? 'No hay fase disponible'}</option>
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
                disabled={isProjectExpired}
              />
            </label>

            <label className="doc-evidence-field doc-evidence-field-full">
              <span>Descripción</span>
              <textarea
                name="descripcion"
                value={evidenceForm.descripcion}
                onChange={handleEvidenceFieldChange}
                placeholder="Describe brevemente la evidencia"
                rows="3"
                disabled={isProjectExpired}
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
                  disabled={isProjectExpired}
                />
                <button
                  type="button"
                  className="custom-file-btn"
                  onClick={() => document.getElementById('custom-evidence-file').click()}
                  disabled={isProjectExpired}
                >
                  Seleccionar archivo
                </button>
                <span className="custom-file-name">
                  {evidenceForm.archivo ? evidenceForm.archivo.name : 'Sin archivos seleccionados'}
                </span>
              </div>
            </label>

            <div className="coor-project-detail-actions-strip">
              <button type="submit" className="coor-project-detail-primary" disabled={savingEvidence || !currentPhase?.id || isProjectExpired}>
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
            <div className="coor-project-detail-empty">Aún no hay evidencias registradas para este proyecto.</div>
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
                      <td>{evidence.observaciones || '-'}</td>
                      <td>
                        <a href={resolveEvidenceUrl(evidence.archivo)} target="_blank" rel="noreferrer" className="coor-project-detail-link">
                          Ver archivo
                        </a>
                      </td>
                      <td>
                        {evidence.estado === 'PENDING' || evidence.estado === 'IN_REVIEW' ? (
                          <button
                            type="button"
                            className="evidence-delete-btn"
                            onClick={() => handleDeleteEvidence(evidence.id)}
                            aria-label={`Eliminar evidencia ${evidence.titulo}`}
                          >
                            <DeleteIcon />
                          </button>
                        ) : null}
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

  function renderBusinessValidationTab() {
    const validation = project?.businessValidation

    if (!validation) {
      return (
        <section className="coor-project-detail-section">
          <div className="coor-project-detail-empty">
            La validación empresarial aún no ha sido registrada por el representante de la empresa.
          </div>
        </section>
      )
    }

    return (
      <section className="coor-project-detail-section">
        <article className="coor-project-detail-panel">
          <div className="coor-project-detail-panel-head">
            <h3>Validacion empresarial final</h3>
            <p>Consulta en modo lectura el concepto final emitido por la empresa sobre el proyecto.</p>
          </div>

          <div className="coor-project-detail-validation-grid">
            <div className="coor-project-detail-meta-item">
              <span>Resolvió el problema</span>
              <strong>{validation.resolvioProblema}</strong>
            </div>
            <div className="coor-project-detail-meta-item">
              <span>La solución es aplicable</span>
              <strong>{validation.esAplicable}</strong>
            </div>
            <div className="coor-project-detail-meta-item">
              <span>Generó valor</span>
              <strong>{validation.generaValor}</strong>
            </div>
            <div className="coor-project-detail-meta-item">
              <span>Desea implementarla</span>
              <strong>{validation.deseaImplementarla}</strong>
            </div>
            <div className="coor-project-detail-meta-item">
              <span>Nombre del firmante</span>
              <strong>{validation.nombreFirmante}</strong>
            </div>
            <div className="coor-project-detail-meta-item">
              <span>Cargo</span>
              <strong>{validation.cargo}</strong>
            </div>
            <div className="coor-project-detail-meta-item full">
              <span>Comentarios</span>
              <strong>{validation.comentarios || '-'}</strong>
            </div>
            <div className="coor-project-detail-meta-item full">
              <span>Firma de la empresa</span>
              {typeof validation.firma === 'string' && validation.firma.trim() ? (
                validation.firma.startsWith('/uploads/') || validation.firma.startsWith('http://') || validation.firma.startsWith('https://') ? (
                  isImageAsset(validation.firma) ? (
                    <div className="doc-validation-signature-preview">
                      <img src={resolveEvidenceUrl(validation.firma)} alt="Firma empresarial adjunta" className="doc-validation-signature-image" />
                      <a href={resolveEvidenceUrl(validation.firma)} target="_blank" rel="noreferrer" className="coor-project-detail-link">
                        Ver firma adjunta
                      </a>
                    </div>
                  ) : (
                    <a href={resolveEvidenceUrl(validation.firma)} target="_blank" rel="noreferrer" className="coor-project-detail-link">
                      Ver firma adjunta
                    </a>
                  )
                ) : (
                  <strong>{validation.firma}</strong>
                )
              ) : (
                <strong>-</strong>
              )}
            </div>
          </div>
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
      case 'validacion':
        return renderBusinessValidationTab()
      default:
        return renderInformationTab()
    }
  }

  return (
    <div className="coor-project-detail-page dashboard-layout-page">
      <DashboardNavbar links={NAV_LINKS} onLogout={handleLogout} activeIndex={1} />

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
                <p className="coor-project-detail-eyebrow">Proyecto asignado</p>
                <h1>{project?.titulo}</h1>
                <div className="coor-project-detail-summary">
                  <span>Empresa: {project?.company?.nombre || '-'}</span>
                  <span>Representante: {project?.company?.representante?.name || '-'}</span>
                  <span>Fase actual: {currentPhase?.nombre ?? 'Proyecto finalizado'}</span>
                </div>
              </div>
              <div className="coor-project-detail-hero-actions">
                <button type="button" className="coor-project-detail-outline" onClick={() => navigate('/participante/proyectos')}>
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

              <div className="coor-project-detail-content">{renderTabContent()}</div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default DetalleParticipanteProyecto

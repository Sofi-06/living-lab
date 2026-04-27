import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import {
  getProject,
  updateProjectBusinessValidation,
} from '../../../../services/projects'
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
import {
  getFirstValidationError,
  validateBusinessValidationForm,
} from '../../../../utils/formValidation'
import { clearSessionUser, getSessionUser } from '../../../../utils/session'
import '../../../coordinador/proyectos/detalle-proyecto/DetalleProyecto.css'
import './DetalleRepresentanteProyecto.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/representante' },
  { label: 'Proyectos', path: '/representante/proyectos' },
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
  { id: 'evaluacion', label: 'Evaluacion' },
  { id: 'validacion', label: 'Validacion empresarial' },
]

const EMPTY_VALIDATION_FORM = {
  resolvioProblema: '',
  esAplicable: '',
  generaValor: '',
  deseaImplementarla: '',
  comentarios: '',
  nombreFirmante: '',
  cargo: '',
  firma: '',
}

const YES_NO_OPTIONS = [
  { value: 'SI', label: 'Si' },
  { value: 'NO', label: 'No' },
]

const SOLVED_OPTIONS = [
  { value: 'SI', label: 'Si' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'NO', label: 'No' },
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

function buildValidationForm(project) {
  if (!project?.businessValidation) {
    return EMPTY_VALIDATION_FORM
  }

  return {
    resolvioProblema: project.businessValidation.resolvioProblema ?? '',
    esAplicable: project.businessValidation.esAplicable ?? '',
    generaValor: project.businessValidation.generaValor ?? '',
    deseaImplementarla: project.businessValidation.deseaImplementarla ?? '',
    comentarios: project.businessValidation.comentarios ?? '',
    nombreFirmante: project.businessValidation.nombreFirmante ?? '',
    cargo: project.businessValidation.cargo ?? '',
    firma: project.businessValidation.firma ?? '',
  }
}

function DetalleRepresentanteProyecto() {
  const navigate = useNavigate()
  const { id } = useParams()
  const sessionUser = getSessionUser()
  const [project, setProject] = useState(null)
  const [activeTab, setActiveTab] = useState('informacion')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [savingValidation, setSavingValidation] = useState(false)
  const [validationForm, setValidationForm] = useState(EMPTY_VALIDATION_FORM)

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      if (!id) return

      setLoading(true)
      setLoadError('')

      try {
        const payload = await getProject(id)
        const nextProject = payload?.project ?? null
        const belongsToRepresentative =
          nextProject?.company?.representante?.id === sessionUser?.id

        if (!cancelled) {
          if (!belongsToRepresentative) {
            setProject(null)
            setLoadError('Este proyecto no pertenece a la empresa asociada a tu usuario.')
          } else {
            setProject(nextProject)
            setValidationForm(buildValidationForm(nextProject))
          }
        }
      } catch (error) {
        if (!cancelled) {
          setProject(null)
          setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el detalle del proyecto')
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

    const timeout = setTimeout(() => setSaveMessage(''), 3500)
    return () => clearTimeout(timeout)
  }, [saveMessage])

  const phases = useMemo(() => ensureProjectPhases(project), [project])
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

  const validationEnabled = Boolean(project?.validationReady || project?.estado === 'COMPLETED' || progress.percentage >= 100)
  const validationCompleted = Boolean(project?.validationCompleted || project?.businessValidation)

  function handleValidationFieldChange(event) {
    const { name, value } = event.target
    setValidationForm((current) => ({ ...current, [name]: value }))
  }

  async function handleValidationSubmit(event) {
    event.preventDefault()

    if (!id || !sessionUser?.id || !validationEnabled) {
      return
    }

    const validationErrors = validateBusinessValidationForm(validationForm)

    if (Object.keys(validationErrors).length > 0) {
      setFormError(getFirstValidationError(validationErrors))
      setSaveMessage('')
      return
    }

    setFormError('')
    setSaveMessage('')
    setSavingValidation(true)

    try {
      const payload = await updateProjectBusinessValidation(id, {
        representanteId: sessionUser.id,
        ...validationForm,
      })

      setProject(payload?.project ?? null)
      setValidationForm(buildValidationForm(payload?.project ?? null))
      setSaveMessage(validationCompleted ? 'La validacion empresarial fue actualizada.' : 'La validacion empresarial fue registrada correctamente.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar la validacion empresarial')
    } finally {
      setSavingValidation(false)
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
              <span>Estado del proyecto</span>
              <strong>{STATUS_LABELS[project?.estado] ?? project?.estado}</strong>
            </div>
            <div className="coor-project-detail-progress-meta-item">
              <span>Fases completadas</span>
              <strong>{progress.completedPhases}</strong>
            </div>
            <div className="coor-project-detail-progress-meta-item">
              <span>Validacion final</span>
              <strong>{validationCompleted ? 'Registrada' : validationEnabled ? 'Pendiente' : 'No habilitada'}</strong>
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
            <span className="coor-project-detail-chip">Participante: {project?.participante?.name ?? '-'}</span>
            <span className="coor-project-detail-chip">Evaluador: {project?.evaluador?.name ?? '-'}</span>
            <span className="coor-project-detail-chip">Representante: {project?.company?.representante?.name ?? '-'}</span>
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
      return <div className="coor-project-detail-empty">Aun no hay evidencias registradas para este proyecto.</div>
    }

    return (
      <section className="coor-project-detail-section">
        <article className="coor-project-detail-panel">
          <div className="coor-project-detail-panel-head">
            <h3>Evidencias del proyecto</h3>
            <p>Consulta en modo solo lectura los soportes registrados durante el desarrollo del proyecto.</p>
          </div>

          <div className="coor-project-detail-table-wrap">
            <table className="coor-project-detail-table">
              <thead>
                <tr>
                  <th>Fase</th>
                  <th>Titulo</th>
                  <th>Descripcion</th>
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
                    <td>{evidence.descripcion || '-'}</td>
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
        </article>
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
            <div className="coor-project-detail-empty">Aun no hay evaluaciones registradas por fase.</div>
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
          )}
        </article>
      </section>
    )
  }

  function renderValidationTab() {
    return (
      <form className="coor-project-detail-section" onSubmit={handleValidationSubmit} noValidate>
        {formError ? <div className="rep-detail-feedback error">{formError}</div> : null}
        {saveMessage ? <div className="rep-detail-feedback success">{saveMessage}</div> : null}

        <article className="coor-project-detail-panel">
          <div className="coor-project-detail-panel-head">
            <h3>Estado de la validacion empresarial</h3>
            <p>La validacion final se habilita cuando el proyecto esta listo para cierre y todas las fases fueron completadas.</p>
          </div>

          <div className="rep-detail-summary-grid">
            <div className="rep-detail-summary-item">
              <span>Proyecto listo para cierre</span>
              <strong>{validationEnabled ? 'Si' : 'No'}</strong>
            </div>
            <div className="rep-detail-summary-item">
              <span>Validacion registrada</span>
              <strong>{validationCompleted ? 'Si' : 'No'}</strong>
            </div>
            <div className="rep-detail-summary-item">
              <span>Progreso del proyecto</span>
              <strong>{progress.percentage}%</strong>
            </div>
          </div>

          {!validationEnabled ? (
            <div className="rep-detail-feedback info">
              La validacion empresarial aun no esta habilitada. Debes esperar a que el proyecto complete todas sus fases o alcance el 100% de progreso.
            </div>
          ) : null}

          {validationCompleted ? (
            <div className="rep-detail-feedback neutral">
              Ya existe una validacion empresarial registrada para este proyecto. Puedes actualizarla si necesitas ajustar la informacion.
            </div>
          ) : null}
        </article>

        <article className="coor-project-detail-panel">
          <div className="coor-project-detail-panel-head">
            <h3>Formulario de validacion empresarial</h3>
            <p>Diligencia la validacion final de la empresa sobre los resultados del proyecto.</p>
          </div>

          <div className="rep-detail-form-grid">
            <label className="rep-detail-field">
              <span>El proyecto resolvio el problema?</span>
              <select
                name="resolvioProblema"
                value={validationForm.resolvioProblema}
                onChange={handleValidationFieldChange}
                disabled={!validationEnabled || savingValidation}
                required
              >
                <option value="">Selecciona una opcion</option>
                {SOLVED_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rep-detail-field">
              <span>La solucion es aplicable?</span>
              <select
                name="esAplicable"
                value={validationForm.esAplicable}
                onChange={handleValidationFieldChange}
                disabled={!validationEnabled || savingValidation}
                required
              >
                <option value="">Selecciona una opcion</option>
                {YES_NO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rep-detail-field">
              <span>Genero valor para la organizacion?</span>
              <select
                name="generaValor"
                value={validationForm.generaValor}
                onChange={handleValidationFieldChange}
                disabled={!validationEnabled || savingValidation}
                required
              >
                <option value="">Selecciona una opcion</option>
                {YES_NO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rep-detail-field">
              <span>Desea implementar la solucion?</span>
              <select
                name="deseaImplementarla"
                value={validationForm.deseaImplementarla}
                onChange={handleValidationFieldChange}
                disabled={!validationEnabled || savingValidation}
                required
              >
                <option value="">Selecciona una opcion</option>
                {YES_NO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rep-detail-field">
              <span>Nombre del firmante</span>
              <input
                type="text"
                name="nombreFirmante"
                value={validationForm.nombreFirmante}
                onChange={handleValidationFieldChange}
                disabled={!validationEnabled || savingValidation}
                placeholder="Nombre completo"
                required
              />
            </label>

            <label className="rep-detail-field">
              <span>Cargo</span>
              <input
                type="text"
                name="cargo"
                value={validationForm.cargo}
                onChange={handleValidationFieldChange}
                disabled={!validationEnabled || savingValidation}
                placeholder="Cargo del firmante"
                required
              />
            </label>

            <label className="rep-detail-field rep-detail-field-full">
              <span>Comentarios</span>
              <textarea
                name="comentarios"
                value={validationForm.comentarios}
                onChange={handleValidationFieldChange}
                disabled={!validationEnabled || savingValidation}
                rows="4"
                placeholder="Comentarios sobre el impacto o implementacion"
              />
            </label>

            <label className="rep-detail-field rep-detail-field-full">
              <span>Firma de la empresa</span>
              <textarea
                name="firma"
                value={validationForm.firma}
                onChange={handleValidationFieldChange}
                disabled={!validationEnabled || savingValidation}
                rows="3"
                placeholder="Registra la firma, sello o identificacion digital de la empresa"
                required
              />
            </label>
          </div>
        </article>

        <div className="coor-project-detail-actions-strip">
          <button
            type="submit"
            className="coor-project-detail-primary"
            disabled={!validationEnabled || savingValidation}
          >
            {savingValidation ? 'Guardando...' : validationCompleted ? 'Actualizar validacion' : 'Guardar validacion'}
          </button>
        </div>
      </form>
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
      case 'validacion':
        return renderValidationTab()
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
        ) : loadError ? (
          <section className="coor-project-detail-shell">
            <div className="coor-project-detail-error">{loadError}</div>
          </section>
        ) : (
          <>
            <section className="coor-project-detail-hero">
              <div>
                <p className="coor-project-detail-eyebrow">Validacion empresarial</p>
                <h1>{project?.titulo}</h1>
                <div className="coor-project-detail-summary">
                  <span>Empresa: {project?.company?.nombre || '-'}</span>
                  <span>Representante: {project?.company?.representante?.name || '-'}</span>
                  <span>Estado: {STATUS_LABELS[project?.estado] ?? project?.estado}</span>
                  <span>Fase actual: {currentPhase?.nombre ?? 'Proyecto finalizado'}</span>
                </div>
              </div>
              <div className="coor-project-detail-hero-actions">
                <button
                  type="button"
                  className="coor-project-detail-outline"
                  onClick={() => navigate('/representante/proyectos')}
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

export default DetalleRepresentanteProyecto

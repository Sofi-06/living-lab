import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { getProject, updateProjectEvaluation } from '../../../../services/projects'
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
import './DetalleEvaluadorProyecto.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const EVALUADOR_NAV_LINKS = [
  { label: 'Dashboard', path: '/evaluador' },
  { label: 'Proyectos', path: '/evaluador/proyectos' },
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
]

const PHASE_REVIEW_TEMPLATES = {
  'co-creación': [
    'El problema fue validado con la empresa',
    'Se identificaron actores y necesidades reales',
    'La evidencia muestra una definicion clara del reto',
  ],
  acción: [
    'La evidencia muestra una accion ejecutada',
    'La accion responde al reto priorizado',
    'La solucion presentada tiene aplicacion practica',
  ],
  medición: [
    'Se registraron indicadores o criterios de resultado',
    'La evidencia permite comparar avances o hallazgos',
    'La medicion se relaciona con la accion realizada',
  ],
  iteración: [
    'Se documentaron ajustes o mejoras',
    'La retroalimentacion se incorporo en la propuesta',
    'La fase evidencia aprendizaje del ciclo anterior',
  ],
  narrativa: [
    'La fase documenta con claridad el proceso',
    'La narrativa comunica resultados y aprendizajes',
    'La evidencia es comprensible para terceros',
  ],
  apropiación: [
    'La empresa reconoce el valor de la solucion',
    'Se evidencia transferencia o adopcion',
    'La fase muestra sostenibilidad o continuidad',
  ],
}

const DETAILED_RESULT_OPTIONS = [
  { value: 'CUMPLE', label: 'Cumple' },
  { value: 'NO_CUMPLE', label: 'No cumple' },
  { value: 'NO_APLICA', label: 'No aplica' },
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

function getPhaseReviewTemplate(phaseName) {
  const normalizedPhase = normalizeText(phaseName)
  return PHASE_REVIEW_TEMPLATES[normalizedPhase] ?? []
}

function buildReviewChecklist(project, currentPhase) {
  const template = getPhaseReviewTemplate(currentPhase?.nombre)
  const currentPhaseChecklist = (project?.phaseChecklist ?? []).find(
    (phaseEntry) => normalizeText(phaseEntry.fase) === normalizeText(currentPhase?.nombre),
  )
  const existingItems = new Map(
    (currentPhaseChecklist?.items ?? []).map((itemEntry) => [normalizeText(itemEntry.item), itemEntry]),
  )

  return template.map((item) => {
    const existingItem = existingItems.get(normalizeText(item))

    return {
      item,
      resultado: existingItem?.resultado ?? '',
      observacion: existingItem?.observacion ?? '',
    }
  })
}

function EvaluationPhaseForm({
  projectId,
  currentPhase,
  currentPhaseEvidences,
  reviewableCurrentPhaseEvidences,
  initialReviewChecklist,
  initialPhaseObservations,
  formError,
  saveMessage,
  savingEvaluation,
  onSubmitEvaluation,
}) {
  const [reviewChecklist, setReviewChecklist] = useState(initialReviewChecklist)
  const [phaseObservations, setPhaseObservations] = useState(initialPhaseObservations)
  const [reviewDecision, setReviewDecision] = useState('')

  function handleDetailedResultChange(itemIndex, resultado) {
    setReviewChecklist((current) =>
      current.map((itemEntry, currentItemIndex) =>
        currentItemIndex === itemIndex
          ? { ...itemEntry, resultado }
          : itemEntry,
      ),
    )
  }

  function handleDetailedObservationChange(itemIndex, observacion) {
    setReviewChecklist((current) =>
      current.map((itemEntry, currentItemIndex) =>
        currentItemIndex === itemIndex
          ? { ...itemEntry, observacion }
          : itemEntry,
      ),
    )
  }

  function validateEvaluationForm() {
    if (!currentPhase?.id) {
      return 'No hay una fase activa para evaluar.'
    }

    if (currentPhaseEvidences.length === 0) {
      return 'La fase actual debe tener evidencias antes de ser evaluada.'
    }

    if (reviewableCurrentPhaseEvidences.length === 0) {
      return 'Esta fase ya tiene un concepto emitido para las evidencias actuales. Debes esperar una nueva evidencia del participante para volver a revisar.'
    }

    if (!reviewDecision) {
      return 'Selecciona si la fase se aprueba o si se solicitan ajustes.'
    }

    const checklistComplete = reviewChecklist.every((itemEntry) => Boolean(itemEntry.resultado))

    if (!checklistComplete) {
      return 'Completa todos los resultados del checklist de la fase antes de guardar.'
    }

    if (reviewDecision === 'reject' && !phaseObservations.trim()) {
      return 'Cuando solicitas ajustes debes registrar observaciones para el participante.'
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextFormError = validateEvaluationForm()

    if (nextFormError) {
      onSubmitEvaluation({ formError: nextFormError })
      return
    }

    await onSubmitEvaluation({
      formError: '',
      payload: {
        projectId,
        projectPhaseId: currentPhase.id,
        approved: reviewDecision === 'approve',
        observaciones: phaseObservations.trim(),
        phaseChecklist: reviewChecklist.map((itemEntry) => ({
          item: itemEntry.item,
          resultado: itemEntry.resultado,
          observacion: itemEntry.observacion.trim(),
        })),
      },
    })
  }

  if (!currentPhase) {
    return (
      <section className="coor-project-detail-section">
        <div className="coor-project-detail-empty">Todas las fases del proyecto ya fueron completadas.</div>
      </section>
    )
  }

  return (
    <form className="coor-project-detail-section" onSubmit={handleSubmit}>
      {formError ? <div className="eval-detail-feedback error">{formError}</div> : null}
      {saveMessage ? <div className="eval-detail-feedback success">{saveMessage}</div> : null}

      <article className="coor-project-detail-panel">
        <div className="coor-project-detail-panel-head">
          <h3>Revision de la fase actual</h3>
          <p>Evalua exclusivamente la fase activa. Si la apruebas, se desbloquea la siguiente fase del proyecto.</p>
        </div>

        <div className="eval-detail-summary-grid">
          <div className="eval-detail-summary-item">
            <span>Fase actual</span>
            <strong>{currentPhase.nombre}</strong>
          </div>
          <div className="eval-detail-summary-item">
            <span>Estado</span>
            <strong>{PHASE_STATUS_LABELS[currentPhase.estado] ?? currentPhase.estado}</strong>
          </div>
          <div className="eval-detail-summary-item">
            <span>Evidencias pendientes</span>
            <strong>{reviewableCurrentPhaseEvidences.length}</strong>
          </div>
        </div>
      </article>

      <article className="coor-project-detail-panel">
        <div className="coor-project-detail-panel-head">
          <h3>Evidencias de {currentPhase.nombre}</h3>
          <p>Solo puedes emitir una nueva revision cuando exista al menos una evidencia pendiente o en revision en esta fase.</p>
        </div>

        {currentPhaseEvidences.length === 0 ? (
          <div className="eval-detail-feedback error">
            La fase actual aun no tiene evidencias. El participante debe registrar entregables antes de que puedas evaluar.
          </div>
        ) : (
          <>
            {reviewableCurrentPhaseEvidences.length === 0 ? (
              <div className="eval-detail-feedback info">
                Ya emitiste un concepto para las evidencias actuales de esta fase. Cuando el participante suba una nueva evidencia, el formulario se habilitara de nuevo.
              </div>
            ) : null}

            <div className="coor-project-detail-table-wrap">
              <table className="coor-project-detail-table">
                <thead>
                  <tr>
                    <th>Titulo</th>
                    <th>Descripcion</th>
                    <th>Usuario</th>
                    <th>Estado</th>
                    <th>Observaciones</th>
                    <th>Archivo</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPhaseEvidences.map((evidence) => (
                    <tr key={evidence.id}>
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
          </>
        )}
      </article>

      <article className="coor-project-detail-panel">
        <div className="coor-project-detail-panel-head">
          <h3>Checklist de la fase</h3>
          <p>Marca el cumplimiento de cada criterio para esta fase y agrega observaciones cuando aplique.</p>
        </div>

        <div className="coor-project-detail-table-wrap">
          <table className="coor-project-detail-table eval-detail-checklist-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Cumple</th>
                <th>No cumple</th>
                <th>No aplica</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {reviewChecklist.map((itemEntry, itemIndex) => (
                <tr key={`${currentPhase.id}-${itemEntry.item}`}>
                  <td>{itemEntry.item}</td>
                  {DETAILED_RESULT_OPTIONS.map((option) => (
                    <td key={option.value}>
                      <label className="eval-detail-radio">
                        <input
                          type="radio"
                          name={`detailed-${itemIndex}`}
                          checked={itemEntry.resultado === option.value}
                          onChange={() => handleDetailedResultChange(itemIndex, option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    </td>
                  ))}
                  <td>
                    <textarea
                      value={itemEntry.observacion}
                      onChange={(event) => handleDetailedObservationChange(itemIndex, event.target.value)}
                      rows="3"
                      placeholder="Observaciones del evaluador"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="coor-project-detail-panel">
        <div className="coor-project-detail-panel-head">
          <h3>Decision del evaluador</h3>
          <p>La aprobacion completa la fase. Si la evidencia requiere mejoras, solicita ajustes y espera una nueva entrega del participante.</p>
        </div>

        <div className="eval-detail-decision-grid">
          <button
            type="button"
            className={reviewDecision === 'approve' ? 'eval-detail-decision active approve' : 'eval-detail-decision approve'}
            onClick={() => setReviewDecision('approve')}
          >
            Aprobar fase
          </button>
          <button
            type="button"
            className={reviewDecision === 'reject' ? 'eval-detail-decision active reject' : 'eval-detail-decision reject'}
            onClick={() => setReviewDecision('reject')}
          >
            Solicitar ajustes
          </button>
        </div>

        <label className="eval-detail-field eval-detail-field-full">
          <span>Observaciones generales</span>
          <textarea
            value={phaseObservations}
            onChange={(event) => setPhaseObservations(event.target.value)}
            rows="5"
            placeholder="Retroalimentacion visible para el participante"
          />
        </label>
      </article>

      <div className="coor-project-detail-actions-strip">
        <button
          type="submit"
          className="coor-project-detail-primary"
          disabled={savingEvaluation || currentPhaseEvidences.length === 0 || reviewableCurrentPhaseEvidences.length === 0}
        >
          {savingEvaluation ? 'Guardando...' : 'Guardar revision'}
        </button>
      </div>
    </form>
  )
}

function DetalleEvaluadorProyecto() {
  const navigate = useNavigate()
  const { id } = useParams()
  const sessionUser = getSessionUser()
  const [project, setProject] = useState(null)
  const [activeTab, setActiveTab] = useState('informacion')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [savingEvaluation, setSavingEvaluation] = useState(false)

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
        const isAssigned = nextProject?.evaluador?.id === sessionUser?.id

        if (!cancelled) {
          if (!isAssigned) {
            setProject(null)
            setLoadError('Este proyecto no esta asignado a tu usuario.')
          } else {
            setProject(nextProject)
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

  const currentPhaseEvidences = useMemo(() => {
    if (!currentPhase?.nombre) return []

    return (project?.evidences ?? []).filter(
      (evidence) => normalizeText(evidence.fase) === normalizeText(currentPhase.nombre),
    )
  }, [currentPhase, project?.evidences])

  const reviewableCurrentPhaseEvidences = useMemo(
    () =>
      currentPhaseEvidences.filter(
        (evidence) => evidence.estado === 'PENDING' || evidence.estado === 'IN_REVIEW',
      ),
    [currentPhaseEvidences],
  )

  const initialReviewChecklist = useMemo(() => buildReviewChecklist(project, currentPhase), [project, currentPhase])
  const initialPhaseObservations = currentPhase?.observaciones ?? ''

  async function handleEvaluationSubmit({ formError: nextFormError = '', payload } = {}) {
    setFormError(nextFormError)
    setSaveMessage('')

    if (nextFormError || !payload) {
      return
    }

    setSavingEvaluation(true)

    try {
      const response = await updateProjectEvaluation(payload.projectId, {
        projectPhaseId: payload.projectPhaseId,
        approved: payload.approved,
        observaciones: payload.observaciones,
        phaseChecklist: payload.phaseChecklist,
      })

      setProject(response?.project ?? null)
      setSaveMessage(
        payload.approved
          ? 'Fase aprobada correctamente. La siguiente fase quedo desbloqueada.'
          : 'Se solicitaron ajustes. El proyecto permanece en la misma fase hasta que el participante suba una nueva evidencia.',
      )
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar la evaluacion')
    } finally {
      setSavingEvaluation(false)
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
          <span className="coor-project-detail-label">Responsables</span>
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
            <p>La evaluacion solo puede realizarse sobre la fase actual, pero aqui puedes consultar el historial completo.</p>
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
      <EvaluationPhaseForm
        key={currentPhase?.id ?? 'completed'}
        projectId={id}
        currentPhase={currentPhase}
        currentPhaseEvidences={currentPhaseEvidences}
        reviewableCurrentPhaseEvidences={reviewableCurrentPhaseEvidences}
        initialReviewChecklist={initialReviewChecklist}
        initialPhaseObservations={initialPhaseObservations}
        formError={formError}
        saveMessage={saveMessage}
        savingEvaluation={savingEvaluation}
        onSubmitEvaluation={handleEvaluationSubmit}
      />
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
      <DashboardNavbar links={EVALUADOR_NAV_LINKS} onLogout={handleLogout} activeIndex={1} />

      <main className="coor-project-detail-main dashboard-layout-main">
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
                <p className="coor-project-detail-eyebrow">Evaluacion de proyecto</p>
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
                  onClick={() => navigate('/evaluador/proyectos')}
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

export default DetalleEvaluadorProyecto

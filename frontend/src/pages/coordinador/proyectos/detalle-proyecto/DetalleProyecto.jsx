import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardNavbar from '../../../../components/navbar/DashboardNavbar'
import { getProject } from '../../../../services/projects'
import { clearSessionUser } from '../../../../utils/session'
import './DetalleProyecto.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/coordinador' },
  { label: 'Proyectos', path: '/coordinador/proyectos' },
  { label: 'Empresas', path: '/coordinador/empresas' },
  { label: 'Usuarios', path: '/coordinador/usuarios' },
  { label: 'Reportes', path: '/coordinador' },
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

const CHECKLIST_RESULT_LABELS = {
  CUMPLE: 'Cumple',
  NO_CUMPLE: 'No cumple',
  PARCIAL: 'Parcial',
}

const TAB_OPTIONS = [
  { id: 'informacion', label: 'Informacion' },
  { id: 'fases', label: 'Fases' },
  { id: 'evidencias', label: 'Evidencias' },
  { id: 'evaluacion', label: 'Evaluacion' },
]

const DEFAULT_PHASES = [
  'Co-creacion',
  'Accion',
  'Medicion',
  'Iteracion',
  'Narrativa',
  'Apropiacion',
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

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function resolveEvidenceUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '#'
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `${API_BASE_URL}${value}`
}

function DetailValue({ label, value }) {
  return (
    <div className="coor-project-detail-meta-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

function DetalleProyecto() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [activeTab, setActiveTab] = useState('informacion')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          <span className="coor-project-detail-label">Usuarios asignados</span>
          <div className="coor-project-detail-users">
            {(project?.users ?? []).map((user) => (
              <span key={user.id} className="coor-project-detail-chip">
                {user.name}
              </span>
            ))}
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

    if (evidences.length === 0) {
      return <div className="coor-project-detail-empty">Aun no hay evidencias registradas para este proyecto.</div>
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
      </section>
    )
  }

  function renderEvaluationTab() {
    const checklist = project?.checklist ?? []
    const validation = project?.businessValidation

    return (
      <section className="coor-project-detail-section">
        <article className="coor-project-detail-panel">
          <div className="coor-project-detail-panel-head">
            <h3>Checklist por fase</h3>
            <p>Vista resumida de criterios y resultados del proyecto.</p>
          </div>

          {checklist.length === 0 ? (
            <div className="coor-project-detail-empty">Aun no hay checklist registrado.</div>
          ) : (
            <div className="coor-project-detail-table-wrap">
              <table className="coor-project-detail-table">
                <thead>
                  <tr>
                    <th>Fase</th>
                    <th>Criterio</th>
                    <th>Resultado</th>
                    <th>Observacion</th>
                  </tr>
                </thead>
                <tbody>
                  {checklist.map((item) => (
                    <tr key={item.id}>
                      <td>{item.fase}</td>
                      <td>{item.criterio}</td>
                      <td>{CHECKLIST_RESULT_LABELS[item.resultado] ?? item.resultado}</td>
                      <td>{item.observacion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="coor-project-detail-panel">
          <div className="coor-project-detail-panel-head">
            <h3>Validacion empresarial</h3>
            <p>Resumen de cierre y percepcion de la empresa.</p>
          </div>

          {!validation ? (
            <div className="coor-project-detail-empty">Aun no hay validacion empresarial registrada.</div>
          ) : (
            <div className="coor-project-detail-validation-grid">
              <DetailValue label="Resolvio problema" value={validation.resolvioProblema} />
              <DetailValue label="Es aplicable" value={validation.esAplicable} />
              <DetailValue label="Genera valor" value={validation.generaValor} />
              <DetailValue label="Desea implementarla" value={validation.deseaImplementarla} />
              <DetailValue label="Firmante" value={validation.nombreFirmante} />
              <DetailValue label="Cargo" value={validation.cargo} />
              <div className="coor-project-detail-meta-item full">
                <span>Comentarios</span>
                <strong>{validation.comentarios || '-'}</strong>
              </div>
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
                <p className="coor-project-detail-eyebrow">Proyecto</p>
                <h1>{project?.titulo}</h1>
                <div className="coor-project-detail-summary">
                  <span>Empresa: {project?.company?.nombre || '-'}</span>
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

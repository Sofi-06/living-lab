import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../components/navbar/DashboardNavbar'
import DashboardFooter from '../../components/footer/DashboardFooter'
import { getRepresentativeProjects } from '../../services/projects'
import { clearSessionUser, getSessionUser } from '../../utils/session'
import './RepresentanteDashboard.css'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/representante' },
  { label: 'Proyectos', path: '/representante/proyectos' },
]

function formatProgress(project) {
  const percentage = Number(project?.progress?.percentage ?? 0)
  return `${percentage}%`
}

function buildValidationLabel(project) {
  if (project?.validationCompleted || project?.businessValidation) {
    return 'Completada'
  }

  if (project?.validationReady) {
    return 'Pendiente'
  }

  return 'No habilitada'
}

function RepresentanteDashboard() {
  const navigate = useNavigate()
  const sessionUser = getSessionUser()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      if (!sessionUser?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const payload = await getRepresentativeProjects(sessionUser.id)

        if (!cancelled) {
          setProjects(payload?.projects ?? [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setProjects([])
          setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los proyectos del representante')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      cancelled = true
    }
  }, [sessionUser?.id])

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date()),
    [],
  )

  const companyName = projects[0]?.company?.nombre ?? 'tu empresa'
  const pendingValidations = projects.filter((project) => project.validationReady && !project.validationCompleted)
  const completedValidations = projects.filter((project) => project.validationCompleted)

  const kpiCards = [
    { label: 'Proyectos de la empresa', value: projects.length, tone: 'active' },
    { label: 'Validaciones pendientes', value: pendingValidations.length, tone: 'warning' },
    { label: 'Validaciones completadas', value: completedValidations.length, tone: 'done' },
  ]

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="rep-page dashboard-layout-page">
      <DashboardNavbar links={NAV_LINKS} onLogout={handleLogout} activeIndex={0} />

      <main className="rep-main dashboard-layout-main">
        <section className="rep-grid">
          <article className="rep-block rep-hero-block">
            <div>
              <h1>Bienvenid@, {sessionUser?.name || 'Representante'}!</h1>
              <p>Panel de validacion empresarial · {today}</p>
              <span className="rep-hero-chip">{companyName}</span>
            </div>
          </article>

          <article className="rep-block rep-kpi-block">
            <h2 className="rep-section-title">Indicadores principales</h2>
            <div className="rep-kpi-grid">
              {kpiCards.map((card) => (
                <div key={card.label} className={`rep-kpi-card ${card.tone}`}>
                  <p>{card.label}</p>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="rep-block">
            <div className="rep-block-head">
              <h2 className="rep-section-title">Validaciones pendientes</h2>
              <button type="button" className="rep-inline-btn" onClick={() => navigate('/representante/proyectos')}>
                Ver proyectos
              </button>
            </div>

            <div className="rep-stats-list">
              {loading ? (
                <div className="rep-stats-item empty">Cargando proyectos...</div>
              ) : pendingValidations.length === 0 ? (
                <div className="rep-stats-item empty">No hay validaciones empresariales pendientes.</div>
              ) : (
                pendingValidations.slice(0, 5).map((project) => (
                  <button
                    type="button"
                    key={project.id}
                    className="rep-stats-item rep-project-item"
                    onClick={() => navigate(`/representante/proyectos/${project.id}`)}
                  >
                    <span>{project.titulo}</span>
                    <strong>{formatProgress(project)}</strong>
                  </button>
                ))
              )}
            </div>
          </article>

          <article className="rep-block">
            <h2 className="rep-section-title">Proyectos asociados</h2>
            <div className="rep-stats-list">
              {loading ? (
                <div className="rep-stats-item empty">Cargando proyectos...</div>
              ) : projects.length === 0 ? (
                <div className="rep-stats-item empty">
                  {error || 'Todavia no hay proyectos asociados a la empresa del representante.'}
                </div>
              ) : (
                projects.slice(0, 5).map((project) => (
                  <button
                    type="button"
                    key={project.id}
                    className="rep-stats-item rep-project-item"
                    onClick={() => navigate(`/representante/proyectos/${project.id}`)}
                  >
                    <span>{project.titulo}</span>
                    <strong>{buildValidationLabel(project)}</strong>
                  </button>
                ))
              )}
            </div>
          </article>
        </section>
        <DashboardFooter />
      </main>
    </div>
  )
}

export default RepresentanteDashboard

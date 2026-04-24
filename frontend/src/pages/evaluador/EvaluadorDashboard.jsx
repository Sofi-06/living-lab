import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../components/navbar/DashboardNavbar'
import DashboardFooter from '../../components/footer/DashboardFooter'
import './EvaluadorDashboard.css'
import { clearSessionUser, getSessionUser } from '../../utils/session'
import { getDashboardMetrics } from '../../services/dashboard'

const EVALUADOR_NAV_LINKS = [
  { label: 'Dashboard', path: '/evaluador' },
  { label: 'Proyectos', path: '/evaluador/proyectos' },
]

const KPI_TEMPLATES = [
  { label: 'Proyectos activos', key: 'projectsActive', tone: 'active' },
  { label: 'Proyectos finalizados', key: 'projectsFinished', tone: 'done' },
  { label: 'Evidencias pendientes', key: 'evidencesPending', tone: 'warning' },
  { label: 'Evaluaciones pendientes', key: 'evaluationsPending', tone: 'warning' },
]

function EvaluadorDashboard() {
  const navigate = useNavigate()
  const sessionUser = getSessionUser()
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadMetrics() {
      try {
        const payload = await getDashboardMetrics({
          role: sessionUser?.role,
          userId: sessionUser?.id,
        })

        if (!cancelled) {
          setMetrics(payload)
        }
      } catch {
        if (!cancelled) {
          setMetrics(null)
        }
      }
    }

    loadMetrics()

    return () => {
      cancelled = true
    }
  }, [sessionUser?.id, sessionUser?.role])

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date()),
    [],
  )

  const kpiCards = useMemo(
    () =>
      KPI_TEMPLATES.map((item) => ({
        label: item.label,
        tone: item.tone,
        value: metrics?.kpis?.[item.key] ?? 0,
      })),
    [metrics],
  )

  const summaryItems = metrics?.summary || []
  const recentActivity = metrics?.recentActivity || []

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="eval-page">
      <DashboardNavbar links={EVALUADOR_NAV_LINKS} onLogout={handleLogout} activeIndex={0} />

      <main className="eval-main">
        <section className="eval-grid">
          <article className="eval-block eval-hero-block">
            <div>
              <h1>Bienvenid@, {sessionUser?.name || 'Usuario'}!</h1>
              <p>Panel de control de Evaluador - {today}</p>
            </div>
          </article>

          <article className="eval-block eval-kpi-block">
            <h2 className="eval-section-title">Tarjetas principales</h2>
            <div className="eval-kpi-grid">
              {kpiCards.map((card) => (
                <div className={`eval-kpi-card ${card.tone}`} key={card.label}>
                  <p>{card.label}</p>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="eval-block">
            <h2 className="eval-section-title">Resumen rapido</h2>
            <div className="eval-stats-list">
              {summaryItems.map((item) => (
                <div className="eval-stats-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="eval-block">
            <h2 className="eval-section-title">Actividad reciente</h2>
            <div className="eval-stats-list">
              {recentActivity.map((item) => (
                <div className="eval-stats-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
        <DashboardFooter />
      </main>
    </div>
  )
}

export default EvaluadorDashboard

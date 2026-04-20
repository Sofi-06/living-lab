import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../components/navbar/DashboardNavbar'
import './DocenteDashboard.css'
import { clearSessionUser, getSessionUser } from '../../utils/session'
import { getDashboardMetrics } from '../../services/dashboard'

const NAV_LINKS = [
  { label: 'Dashboard' },
  { label: 'Proyectos' },
  { label: 'Empresas' },
  { label: 'Usuarios' },
  { label: 'Reportes' },
]

const KPI_TEMPLATES = [
  { label: 'Proyectos activos', key: 'projectsActive', tone: 'active' },
  { label: 'Proyectos finalizados', key: 'projectsFinished', tone: 'done' },
  { label: 'Evidencias pendientes', key: 'evidencesPending', tone: 'warning' },
  { label: 'Evaluaciones pendientes', key: 'evaluationsPending', tone: 'warning' },
]



function DocenteDashboard() {
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
    <div className="doc-page">
      <DashboardNavbar links={NAV_LINKS} onLogout={handleLogout} activeIndex={0} />

      <main className="doc-main">
        <section className="doc-grid">
          <article className="doc-block doc-hero-block">
            <div>
              <h1>Bienvenid@, {sessionUser?.name || 'Usuario'}!</h1>
              <p>Panel de control de Docente · {today}</p>
            </div>
          </article>

          <article className="doc-block doc-kpi-block">
            <h2 className="doc-section-title">Tarjetas principales</h2>
            <div className="doc-kpi-grid">
              {kpiCards.map((card) => (
                <div className={`doc-kpi-card ${card.tone}`} key={card.label}>
                  <p>{card.label}</p>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="doc-block">
            <h2 className="doc-section-title">Resumen rapido</h2>
            <div className="doc-stats-list">
              {summaryItems.map((item) => (
                <div className="doc-stats-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="doc-block">
            <h2 className="doc-section-title">Actividad reciente</h2>
            <div className="doc-stats-list">
              {recentActivity.map((item) => (
                <div className="doc-stats-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

        </section>
      </main>
    </div>
  )
}

export default DocenteDashboard

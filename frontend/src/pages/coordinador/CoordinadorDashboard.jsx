import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../components/navbar/DashboardNavbar'
import { COORDINADOR_LINKS } from '../../components/navbar/dashboardLinks'
import DashboardFooter from '../../components/footer/DashboardFooter'
import './CoordinadorDashboard.css'
import { clearSessionUser, getSessionUser } from '../../utils/session'
import { getDashboardMetrics } from '../../services/dashboard'

const KPI_TEMPLATES = [
  { label: 'Proyectos activos', key: 'projectsActive', tone: 'active' },
  { label: 'Proyectos finalizados', key: 'projectsFinished', tone: 'done' },
  { label: 'Evidencias pendientes', key: 'evidencesPending', tone: 'warning' },
  { label: 'Evaluaciones pendientes', key: 'evaluationsPending', tone: 'warning' },
]



function CoordinadorDashboard() {
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
  const totalUsers = summaryItems.find((item) => item.label === 'Usuarios registrados')?.value ?? 0

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="coor-page dashboard-layout-page">
      <DashboardNavbar links={COORDINADOR_LINKS} onLogout={handleLogout} activeIndex={0} />

      <main className="coor-main dashboard-layout-main">
        <section className="coor-grid">
          <article className="coor-block coor-hero-block">
            <div>
              <h1>Bienvenid@, {sessionUser?.name || 'Usuario'}!</h1>
              <p>Panel de control de Coordinador · {today}</p>
              <p>Total de usuarios registrados: {totalUsers}</p>
            </div>
          </article>

          <article className="coor-block coor-kpi-block">
            <h2 className="coor-section-title">Tarjetas principales</h2>
            <div className="coor-kpi-grid">
              {kpiCards.map((card) => (
                <div key={card.label} className={`coor-kpi-card ${card.tone}`}>
                  <p>{card.label}</p>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="coor-block">
            <h2 className="coor-section-title">Resumen rapido</h2>
            <div className="coor-stats-list">
              {summaryItems.map((item) => (
                <div className="coor-stats-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="coor-block">
            <h2 className="coor-section-title">Actividad reciente</h2>
            <div className="coor-stats-list">
              {recentActivity.map((item) => (
                <div className="coor-stats-item" key={item.label}>
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

export default CoordinadorDashboard

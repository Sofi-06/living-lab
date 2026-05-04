import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../../components/navbar/DashboardNavbar'
import Pagination from '../../../components/pagination/Pagination'
import { getProjects } from '../../../services/projects'
import { clearSessionUser, getSessionUser } from '../../../utils/session'
import '../../coordinador/proyectos/Proyecto.css'

const PAGE_SIZE = 8

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

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function ParticipanteProyecto() {
  const navigate = useNavigate()
  const sessionUser = getSessionUser()
  const [projects, setProjects] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      setLoading(true)
      setError('')

      try {
        const payload = await getProjects('', { userId: sessionUser?.id })

        if (!cancelled) {
          setProjects(payload?.projects ?? [])
        }
      } catch (fetchError) {
        if (!cancelled) {
          setProjects([])
          setError(fetchError instanceof Error ? fetchError.message : 'No se pudo cargar la lista de proyectos')
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

  useEffect(() => {
    if (!error) return undefined

    const timeout = setTimeout(() => setError(''), 3000)
    return () => clearTimeout(timeout)
  }, [error])

  const filteredProjects = useMemo(() => {
    const term = normalizeText(searchValue)

    if (!term) return projects

    return projects.filter((project) => {
      const company = normalizeText(project.company?.nombre)
      const title = normalizeText(project.titulo)
      const problem = normalizeText(project.descripcionProblema)
      const result = normalizeText(project.resultadoEsperado)
      const status = normalizeText(project.estado)

      return (
        company.includes(term) ||
        title.includes(term) ||
        problem.includes(term) ||
        result.includes(term) ||
        status.includes(term)
      )
    })
  }, [projects, searchValue])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchValue])

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredProjects.slice(startIndex, startIndex + PAGE_SIZE)
  }, [currentPage, filteredProjects])

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="coor-project-page dashboard-layout-page">
      <DashboardNavbar links={NAV_LINKS} onLogout={handleLogout} activeIndex={1} />

      <main className="coor-project-main dashboard-layout-main">
        <section className="coor-project-hero">
          <div>
            <p className="coor-project-eyebrow">Participante</p>
            <h1>Proyectos asignados</h1>
            <p>Consulta tus proyectos, revisa las fases y registra evidencias del trabajo realizado.</p>
          </div>
        </section>

        <section className="coor-project-card">
          <div className="coor-project-toolbar">
            <div>
              <h2>Tus proyectos</h2>
              <p>Busca por título, empresa, problema o estado.</p>
            </div>

            <label className="coor-project-search">
              <span>Buscar</span>
              <input
                type="search"
                placeholder="Título, empresa o estado"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </label>
          </div>

          {error ? <div className="coor-project-alert error">{error}</div> : null}

          <div className="coor-project-table-wrap">
            {loading ? (
              <div className="coor-project-empty">Cargando proyectos asignados...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="coor-project-empty">
                {projects.length === 0
                  ? 'Todavía no tienes proyectos asignados.'
                  : 'No se encontraron proyectos con ese criterio.'}
              </div>
            ) : (
              <table className="coor-project-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Empresa</th>
                    <th>Título</th>
                    <th>Descripción del problema</th>
                    <th>Resultado esperado</th>
                    <th>Estado</th>
                    <th>Fecha inicio</th>
                    <th>Fecha fin</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map((project) => (
                    <tr key={project.id}>
                      <td>{project.id}</td>
                      <td>
                        <div className="coor-project-company">
                          <strong>{project.company?.nombre ?? 'Sin empresa'}</strong>
                          <span>ID {project.companyId}</span>
                        </div>
                      </td>
                      <td>{project.titulo}</td>
                      <td>{project.descripcionProblema}</td>
                      <td>{project.resultadoEsperado}</td>
                      <td>
                        <span className={`coor-project-status ${normalizeText(project.estado)}`}>
                          {STATUS_LABELS[project.estado] ?? project.estado}
                        </span>
                      </td>
                      <td>{formatDate(project.fechaInicio)}</td>
                      <td>{formatDate(project.fechaFin)}</td>
                      <td>
                        <div className="coor-project-actions">
                          <button
                            type="button"
                            className="coor-project-action secondary"
                            onClick={() => navigate(`/participante/proyectos/${project.id}`)}
                          >
                            Ver proyecto
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredProjects.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemLabel="proyectos"
          />
        </section>
      </main>
    </div>
  )
}

export default ParticipanteProyecto

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../../components/navbar/DashboardNavbar'
import Pagination from '../../../components/pagination/Pagination'
import { getRepresentativeProjects } from '../../../services/projects'
import { clearSessionUser, getSessionUser } from '../../../utils/session'
import '../../coordinador/proyectos/Proyecto.css'
import './RepresentanteProyecto.css'

const PAGE_SIZE = 8

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

function getValidationStatus(project) {
  if (project?.validationCompleted || project?.businessValidation) {
    return { label: 'Completada', tone: 'completed' }
  }

  if (project?.validationReady) {
    return { label: 'Pendiente', tone: 'pending' }
  }

  return { label: 'No habilitada', tone: 'blocked' }
}

function RepresentanteProyecto() {
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
      } catch (fetchError) {
        if (!cancelled) {
          setProjects([])
          setError(fetchError instanceof Error ? fetchError.message : 'No se pudo cargar la lista de proyectos del representante')
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

  const filteredProjects = useMemo(() => {
    const term = normalizeText(searchValue)

    if (!term) return projects

    return projects.filter((project) => {
      const validation = normalizeText(getValidationStatus(project).label)

      return [
        project.company?.nombre,
        project.company?.sector,
        project.titulo,
        project.descripcionProblema,
        project.resultadoEsperado,
        project.estado,
        validation,
      ]
        .map(normalizeText)
        .some((value) => value.includes(term))
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
            <p className="coor-project-eyebrow">Representante</p>
            <h1>Proyectos de la empresa</h1>
            <p>Consulta el estado del proyecto y completa la validacion empresarial final cuando quede habilitada.</p>
          </div>
        </section>

        <section className="coor-project-card">
          <div className="coor-project-toolbar">
            <div>
              <h2>Listado de proyectos</h2>
              <p>Busca por titulo, empresa, estado o estado de validacion.</p>
            </div>

            <label className="coor-project-search">
              <span>Buscar</span>
              <input
                type="search"
                placeholder="Titulo, empresa o validacion"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </label>
          </div>

          {error ? <div className="coor-project-alert error">{error}</div> : null}

          <div className="coor-project-table-wrap">
            {loading ? (
              <div className="coor-project-empty">Cargando proyectos asociados...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="coor-project-empty">
                {projects.length === 0
                  ? 'Todavia no hay proyectos asociados a la empresa del representante.'
                  : 'No se encontraron proyectos con ese criterio.'}
              </div>
            ) : (
              <table className="coor-project-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Empresa</th>
                    <th>Titulo</th>
                    <th>Estado</th>
                    <th>Progreso</th>
                    <th>Validacion empresarial</th>
                    <th>Fecha fin</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map((project) => {
                    const validationStatus = getValidationStatus(project)

                    return (
                      <tr key={project.id}>
                        <td>{project.id}</td>
                        <td>
                          <div className="coor-project-company">
                            <strong>{project.company?.nombre ?? 'Sin empresa'}</strong>
                            <span>{project.company?.sector ?? 'Sin sector'}</span>
                          </div>
                        </td>
                        <td>{project.titulo}</td>
                        <td>
                          <span className={`coor-project-status ${normalizeText(project.estado)}`}>
                            {STATUS_LABELS[project.estado] ?? project.estado}
                          </span>
                        </td>
                        <td>{project.progress?.percentage ?? 0}%</td>
                        <td>
                          <span className={`rep-project-validation-badge ${validationStatus.tone}`}>
                            {validationStatus.label}
                          </span>
                        </td>
                        <td>{formatDate(project.fechaFin)}</td>
                        <td>
                          <div className="coor-project-actions">
                            <button
                              type="button"
                              className="coor-project-action secondary"
                              onClick={() => navigate(`/representante/proyectos/${project.id}`)}
                            >
                              {project.validationReady ? 'Validar' : 'Ver detalle'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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

export default RepresentanteProyecto

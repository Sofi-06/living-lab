import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditIcon, ViewIcon } from '../../../components/icons/ActionIcons'
import DashboardNavbar from '../../../components/navbar/DashboardNavbar'
import { COORDINADOR_LINKS } from '../../../components/navbar/dashboardLinks'
import { getProjects } from '../../../services/projects'
import { clearSessionUser } from '../../../utils/session'
import './Proyecto.css'

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

function Proyecto() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      setLoading(true)
      setError('')

      try {
        const payload = await getProjects()

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
  }, [])

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
      const titulo = normalizeText(project.titulo)
      const descripcion = normalizeText(project.descripcionProblema)
      const resultado = normalizeText(project.resultadoEsperado)
      const estado = normalizeText(project.estado)
      const assignments = [
        project.company?.representante?.name,
        project.company?.representante?.email,
        project.participante?.name,
        project.participante?.email,
        project.evaluador?.name,
        project.evaluador?.email,
      ]
        .map(normalizeText)
        .join(' ')

      return (
        company.includes(term) ||
        titulo.includes(term) ||
        descripcion.includes(term) ||
        resultado.includes(term) ||
        estado.includes(term) ||
        assignments.includes(term)
      )
    })
  }, [projects, searchValue])

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="coor-project-page">
      <DashboardNavbar links={COORDINADOR_LINKS} onLogout={handleLogout} activeIndex={1} />

      <main className="coor-project-main">
        <section className="coor-project-hero">
          <div>
            <p className="coor-project-eyebrow">Administracion</p>
            <h1>Proyectos</h1>
            <p>Crea proyectos reales, asigna empresa y vincula las personas responsables.</p>
          </div>

          <button
            type="button"
            className="coor-project-create-btn"
            onClick={() => navigate('/coordinador/proyectos/crear-proyecto')}
          >
            Crear proyecto
          </button>
        </section>

        <section className="coor-project-card">
          <div className="coor-project-toolbar">
            <div>
              <h2>Listado de proyectos</h2>
              <p>Filtra por titulo, empresa, estado o responsables del proyecto.</p>
            </div>

            <label className="coor-project-search">
              <span>Buscar</span>
              <input
                type="search"
                placeholder="Titulo, empresa, estado o responsable"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </label>
          </div>

          {error ? <div className="coor-project-alert error">{error}</div> : null}

          <div className="coor-project-table-wrap">
            {loading ? (
              <div className="coor-project-empty">Cargando proyectos...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="coor-project-empty">No se encontraron proyectos con ese criterio.</div>
            ) : (
              <table className="coor-project-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Empresa</th>
                    <th>Titulo</th>
                    <th>Descripcion del problema</th>
                    <th>Resultado esperado</th>
                    <th>Estado</th>
                    <th>Fecha inicio</th>
                    <th>Fecha fin</th>
                    <th>Asignaciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
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
                        <div className="coor-project-users">
                          <span className="coor-project-user-chip">Rep: {project.company?.representante?.name ?? '-'}</span>
                          <span className="coor-project-user-chip">Par: {project.participante?.name ?? '-'}</span>
                          <span className="coor-project-user-chip">Eval: {project.evaluador?.name ?? '-'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="coor-project-actions">
                          <button
                            type="button"
                            className="coor-project-action icon-only"
                            onClick={() => navigate(`/coordinador/proyectos/editar-proyecto/${project.id}`)}
                            aria-label={`Editar proyecto ${project.titulo}`}
                            title="Editar"
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            className="coor-project-action secondary"
                            onClick={() => navigate(`/coordinador/proyectos/${project.id}`)}
                          >
                            <ViewIcon />
                            Ver detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Proyecto

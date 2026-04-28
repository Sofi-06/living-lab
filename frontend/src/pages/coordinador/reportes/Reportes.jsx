import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdAssessment, MdDownload, MdFilterAlt } from 'react-icons/md'
import DashboardNavbar from '../../../components/navbar/DashboardNavbar'
import { COORDINADOR_LINKS } from '../../../components/navbar/dashboardLinks'
import { getCompanies } from '../../../services/companies'
import { getProject, getProjects } from '../../../services/projects'
import { downloadReportExcel } from '../../../utils/reportExcel'
import { clearSessionUser } from '../../../utils/session'
import './Reportes.css'

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const DEFAULT_PHASES = [
  'Co-creacion',
  'Accion',
  'Medicion',
  'Iteracion',
  'Narrativa',
  'Apropiacion',
]

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizePhaseName(value) {
  return typeof value === 'string'
    ? value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
    : ''
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

function getStatusLabel(value) {
  return STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value ?? '-'
}

function toDateTimestamp(value, fallback = Number.NaN) {
  if (!value) return fallback

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? fallback : date.getTime()
}

function buildPreviewProject(project) {
  return {
    ...project,
    phases: Array.isArray(project?.phases) ? project.phases : [],
    phaseNames: Array.isArray(project?.phases)
      ? project.phases.map((phase) => phase.nombre).filter(Boolean)
      : [],
  }
}

function Reportes() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    companyId: '',
    projectId: '',
    phase: '',
    status: '',
    startDate: '',
    endDate: '',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    companyId: '',
    projectId: '',
    phase: '',
    status: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    let cancelled = false

    async function loadReportData() {
      setLoading(true)
      setError('')

      try {
        const [companiesPayload, projectsPayload] = await Promise.all([
          getCompanies(),
          getProjects(),
        ])

        const baseProjects = projectsPayload?.projects ?? []
        const detailResults = await Promise.allSettled(
          baseProjects.map((project) => getProject(project.id)),
        )

        if (cancelled) {
          return
        }

        const detailedProjects = detailResults.map((result, index) => {
          if (result.status === 'fulfilled') {
            return buildPreviewProject(result.value?.project ?? baseProjects[index])
          }

          return buildPreviewProject(baseProjects[index])
        })

        setCompanies(companiesPayload?.companies ?? [])
        setProjects(detailedProjects)
      } catch (loadError) {
        if (!cancelled) {
          setCompanies([])
          setProjects([])
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la informacion de reportes')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadReportData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!error) return undefined

    const timeout = setTimeout(() => setError(''), 3500)
    return () => clearTimeout(timeout)
  }, [error])

  const availableProjects = useMemo(() => {
    if (!filters.companyId) {
      return projects
    }

    return projects.filter((project) => String(project.companyId) === filters.companyId)
  }, [filters.companyId, projects])

  const phaseOptions = useMemo(() => {
    const indexedPhases = new Map(DEFAULT_PHASES.map((phase) => [normalizePhaseName(phase), phase]))

    projects.forEach((project) => {
      ;(project.phaseNames ?? []).forEach((phaseName) => {
        const normalizedName = normalizePhaseName(phaseName)

        if (normalizedName && !indexedPhases.has(normalizedName)) {
          indexedPhases.set(normalizedName, phaseName)
        }
      })
    })

    return [...indexedPhases.values()]
  }, [projects])

  const dateRangeError = useMemo(() => {
    if (!filters.startDate || !filters.endDate) return ''

    return filters.endDate < filters.startDate
      ? 'La fecha final no puede ser anterior a la fecha inicial.'
      : ''
  }, [filters.endDate, filters.startDate])

  const filteredProjects = useMemo(() => {
    const selectedStart = toDateTimestamp(appliedFilters.startDate)
    const selectedEnd = toDateTimestamp(appliedFilters.endDate)
    const hasStart = Number.isFinite(selectedStart)
    const hasEnd = Number.isFinite(selectedEnd)
    const selectedPhase = normalizePhaseName(appliedFilters.phase)

    return projects.filter((project) => {
      if (appliedFilters.companyId && String(project.companyId) !== appliedFilters.companyId) {
        return false
      }

      if (appliedFilters.projectId && String(project.id) !== appliedFilters.projectId) {
        return false
      }

      if (appliedFilters.status && project.estado !== appliedFilters.status) {
        return false
      }

      if (selectedPhase) {
        const phaseMatch = (project.phaseNames ?? []).some(
          (phaseName) => normalizePhaseName(phaseName) === selectedPhase,
        )

        if (!phaseMatch) {
          return false
        }
      }

      const projectStart = toDateTimestamp(
        typeof project.fechaInicio === 'string' ? project.fechaInicio.slice(0, 10) : '',
      )
      const projectEnd = toDateTimestamp(
        typeof project.fechaFin === 'string' ? project.fechaFin.slice(0, 10) : '',
        projectStart,
      )

      if (hasStart && (!Number.isFinite(projectStart) || projectStart < selectedStart)) {
        return false
      }

      if (hasEnd && (!Number.isFinite(projectEnd) || projectEnd > selectedEnd)) {
        return false
      }

      return true
    })
  }, [appliedFilters, projects])

  const reportStats = useMemo(() => {
    if (!Object.values(appliedFilters).some((value) => value.trim() !== '')) {
      return {
        projects: 0,
        companies: 0,
        phases: 0,
      }
    }

    return {
      projects: filteredProjects.length,
      companies: new Set(filteredProjects.map((project) => project.company?.nombre).filter(Boolean)).size,
      phases: new Set(
        filteredProjects.flatMap((project) => project.phaseNames ?? []).map((phaseName) => normalizePhaseName(phaseName)),
      ).size,
    }
  }, [appliedFilters, filteredProjects])

  const hasDraftFilters = useMemo(() => {
    return Object.values(filters).some((value) => value.trim() !== '')
  }, [filters])

  const hasAppliedFilters = useMemo(() => {
    return Object.values(appliedFilters).some((value) => value.trim() !== '')
  }, [appliedFilters])

  const exportProjects = hasAppliedFilters ? filteredProjects : projects

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  function handleFilterChange(key, value) {
    setFilters((current) => {
      if (key === 'companyId') {
        const nextProjectId =
          value && current.projectId && projects.some(
            (project) => String(project.id) === current.projectId && String(project.companyId) === value,
          )
            ? current.projectId
            : ''

        return {
          ...current,
          companyId: value,
          projectId: nextProjectId,
        }
      }

      return {
        ...current,
        [key]: value,
      }
    })
  }

  function handleResetFilters() {
    setFilters({
      companyId: '',
      projectId: '',
      phase: '',
      status: '',
      startDate: '',
      endDate: '',
    })
    setAppliedFilters({
      companyId: '',
      projectId: '',
      phase: '',
      status: '',
      startDate: '',
      endDate: '',
    })
  }

  function handleApplyFilters() {
    if (!hasDraftFilters || dateRangeError) {
      return
    }

    setAppliedFilters({ ...filters })
  }

  function handleDownloadReport() {
    const currentDate = new Date()
    const fileDate = currentDate.toISOString().slice(0, 10)

    downloadReportExcel({
      projects: exportProjects,
      generatedAt: formatDateTime(currentDate),
      fileName: `reporte-livinglab-${fileDate}.xls`,
      getStatusLabel,
      formatDate,
    })
  }

  return (
    <div className="coor-report-page dashboard-layout-page">
      <DashboardNavbar links={COORDINADOR_LINKS} onLogout={handleLogout} activeIndex={4} />

      <main className="coor-report-main dashboard-layout-main">
        <section className="coor-report-hero">
          <div>
            <p className="coor-report-eyebrow">Coordinacion</p>
            <h1>Reportes</h1>
            <p>Aplica filtros basicos para previsualizar los proyectos que entrarian en tu reporte.</p>
          </div>

        </section>

        <section className="coor-report-card">
          <div className="coor-report-card-head">
            <div>
              <h2>Filtros del reporte</h2>
              <p>Empresa, proyecto, fase, estado y rango de fechas.</p>
            </div>

            <div className="coor-report-metrics">
              <article>
                <strong>{reportStats.projects}</strong>
                <span>Proyectos</span>
              </article>
              <article>
                <strong>{reportStats.companies}</strong>
                <span>Empresas</span>
              </article>
              <article>
                <strong>{reportStats.phases}</strong>
                <span>Fases</span>
              </article>
            </div>
          </div>

          {error ? <div className="coor-report-alert error">{error}</div> : null}
          {dateRangeError ? <div className="coor-report-alert error">{dateRangeError}</div> : null}

          <div className="coor-report-filter-grid">
            <article className="coor-report-filter-card">
              <h3>Empresa</h3>
              <p>Filtra el reporte por la empresa vinculada al proyecto.</p>
              <label>
                <span>Empresa</span>
                <select
                  value={filters.companyId}
                  onChange={(event) => handleFilterChange('companyId', event.target.value)}
                >
                  <option value="">Todas las empresas</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </article>

            <article className="coor-report-filter-card">
              <h3>Proyecto</h3>
              <p>Acota el resultado a un proyecto puntual si ya lo tienes definido.</p>
              <label>
                <span>Proyecto</span>
                <select
                  value={filters.projectId}
                  onChange={(event) => handleFilterChange('projectId', event.target.value)}
                >
                  <option value="">Todos los proyectos</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.titulo}
                    </option>
                  ))}
                </select>
              </label>
            </article>

            <article className="coor-report-filter-card">
              <h3>Fase</h3>
              <p>Usa las fases registradas del proyecto para afinar la consulta.</p>
              <label>
                <span>Fase</span>
                <select
                  value={filters.phase}
                  onChange={(event) => handleFilterChange('phase', event.target.value)}
                >
                  <option value="">Todas las fases</option>
                  {phaseOptions.map((phase) => (
                    <option key={phase} value={phase}>
                      {phase}
                    </option>
                  ))}
                </select>
              </label>
            </article>

            <article className="coor-report-filter-card">
              <h3>Estado</h3>
              <p>Consulta rapidamente proyectos pendientes, en progreso o finalizados.</p>
              <label>
                <span>Estado</span>
                <select
                  value={filters.status}
                  onChange={(event) => handleFilterChange('status', event.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </article>

            <article className="coor-report-filter-card coor-report-filter-card-wide">
              <h3>Fecha</h3>
              <p>Define el rango de inicio y fin para la previsualizacion del reporte.</p>
              <div className="coor-report-date-grid">
                <label>
                  <span>Fecha inicio</span>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(event) => handleFilterChange('startDate', event.target.value)}
                  />
                </label>

                <label>
                  <span>Fecha fin</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(event) => handleFilterChange('endDate', event.target.value)}
                  />
                </label>
              </div>
            </article>
          </div>

          <div className="coor-report-actions">
            <button
              type="button"
              className="coor-report-btn primary"
              onClick={handleApplyFilters}
              disabled={!hasDraftFilters || Boolean(dateRangeError)}
            >
              <MdAssessment aria-hidden="true" />
              <span>Aplicar filtros</span>
            </button>

            <button type="button" className="coor-report-btn ghost" onClick={handleResetFilters}>
              <MdFilterAlt aria-hidden="true" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        </section>

        {hasAppliedFilters ? (
          <section className="coor-report-table-card">
            <div className="coor-report-table-head">
              <div>
                <h2>Previsualizacion del reporte</h2>
                <p>Listado de proyectos que cumplen con los filtros seleccionados.</p>
              </div>

              <button
                type="button"
                className="coor-report-btn secondary"
                onClick={handleDownloadReport}
                disabled={loading || filteredProjects.length === 0}
              >
                <MdDownload aria-hidden="true" />
                <span>Descargar Excel</span>
              </button>
            </div>

            {loading ? (
              <div className="coor-report-empty">Cargando informacion del reporte...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="coor-report-empty">No hay proyectos que coincidan con los filtros aplicados.</div>
            ) : (
              <div className="coor-report-table-wrap">
                <table className="coor-report-table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Proyecto</th>
                      <th>Fases</th>
                      <th>Estado</th>
                      <th>Fecha inicio</th>
                      <th>Fecha fin</th>
                      <th>Usuarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id}>
                        <td>{project.company?.nombre ?? 'Sin empresa'}</td>
                        <td>
                          <div className="coor-report-project-cell">
                            <strong>{project.titulo}</strong>
                            <span>ID {project.id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="coor-report-chip-list">
                            {(project.phaseNames ?? []).length > 0 ? (
                              project.phaseNames.map((phaseName) => (
                                <span key={`${project.id}-${phaseName}`} className="coor-report-chip">
                                  {phaseName}
                                </span>
                              ))
                            ) : (
                              <span className="coor-report-chip muted">Sin fases</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`coor-report-status ${normalizeText(project.estado)}`}>
                            {STATUS_OPTIONS.find((option) => option.value === project.estado)?.label ?? project.estado}
                          </span>
                        </td>
                        <td>{formatDate(project.fechaInicio)}</td>
                        <td>{formatDate(project.fechaFin)}</td>
                        <td>
                          <div className="coor-report-chip-list">
                            {(project.users ?? []).map((user) => (
                              <span key={`${project.id}-${user.id}`} className="coor-report-chip user">
                                {user.name}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default Reportes

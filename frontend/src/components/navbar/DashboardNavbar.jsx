import './DashboardNavbar.css'
import { useNavigate } from 'react-router-dom'
import {
  MdDashboard,
  MdFolderOpen,
  MdApartment,
  MdPeople,
  MdAssessment,
  MdLogout,
} from 'react-icons/md'

const ICON_BY_LABEL = {
  dashboard: MdDashboard,
  proyectos: MdFolderOpen,
  empresas: MdApartment,
  usuarios: MdPeople,
  reportes: MdAssessment,
}

const BRAND_TITLE = 'LivingLab'

function iconFromLabel(label, index) {
  const normalized = typeof label === 'string' ? label.trim().toLowerCase() : ''
  return ICON_BY_LABEL[normalized] || (index === 0 ? MdDashboard : MdFolderOpen)
}

function MenuIcon({ name, className = '' }) {
  const IconComponent = name
  return <IconComponent aria-hidden="true" className={`navbar-icon ${className}`} />
}

function DashboardNavbar({ links, onLogout, activeIndex = 0 }) {
  const navigate = useNavigate()

  function handleNavigate(path) {
    if (typeof path === 'string' && path.trim()) {
      navigate(path)
    }
  }

  return (
    <aside className="dashboard-navbar-shell" aria-label="Menu principal">
      <div className="dashboard-navbar-rail">
        <div className="rail-icons">
          {links.map((link, index) => (
            <div
              key={`rail-${link.label}`}
              className={index === activeIndex ? 'rail-icon-wrap rail-icon-active' : 'rail-icon-wrap'}
            >
              <MenuIcon name={iconFromLabel(link.label, index)} />
            </div>
          ))}

          <button
            type="button"
            className="rail-icon-wrap rail-logout-btn"
            onClick={onLogout}
            aria-label="Cerrar sesion"
          >
            <MenuIcon name={MdLogout} className="rail-logout-icon" />
          </button>
        </div>
      </div>

      <div className="dashboard-navbar">
        <div className="navbar-brand">
          <span className="brand-title">{BRAND_TITLE}</span>
        </div>

        <nav className="navbar-links" aria-label="Opciones de navegacion">
          {links.map((link, index) => (
            <button
              type="button"
              key={`${link.label}-${index}`}
              className={index === activeIndex ? 'navbar-link navbar-link-active' : 'navbar-link'}
              onClick={() => handleNavigate(link.path)}
            >
              <span className="navbar-link-text">{link.label}</span>
            </button>
          ))}

          <button type="button" className="navbar-link navbar-logout-link" onClick={onLogout}>
            <span className="navbar-link-text">Cerrar sesión</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}

export default DashboardNavbar

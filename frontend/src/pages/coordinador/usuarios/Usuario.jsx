import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../../components/navbar/DashboardNavbar'
import { clearSessionUser } from '../../../utils/session'
import { deleteUser, getUsers } from '../../../services/users'
import './Usuario.css'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/coordinador' },
  { label: 'Proyectos', path: '/coordinador/proyectos' },
  { label: 'Empresas', path: '/coordinador/empresas' },
  { label: 'Usuarios', path: '/coordinador/usuarios' },
  { label: 'Reportes', path: '/coordinador' },
]

const ROLE_OPTIONS = [
  { value: 'COORDINADOR', label: 'Coordinador' },
  { value: 'DOCENTE', label: 'Docente' },
  { value: 'EVALUADOR', label: 'Evaluador' },
  { value: 'ESTUDIANTE', label: 'Estudiante' },
]

function formatDate(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function Usuario() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      setLoading(true)
      setError('')

      try {
        const payload = await getUsers()

        if (!cancelled) {
          setUsers(payload?.users ?? [])
        }
      } catch (fetchError) {
        if (!cancelled) {
          setUsers([])
          setError(fetchError instanceof Error ? fetchError.message : 'No se pudo cargar la lista de usuarios')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      cancelled = true
    }
  }, [])

  // Ocultar mensajes después de 3 segundos
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 3000)
      return () => clearTimeout(timeout)
    }
  }, [message])

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(''), 3000)
      return () => clearTimeout(timeout)
    }
  }, [error])

  const filteredUsers = useMemo(() => {
    const searchTerm = normalizeText(searchValue)

    if (!searchTerm) return users

    return users.filter((user) => {
      const name = normalizeText(user.name)
      const email = normalizeText(user.email)
      const role = normalizeText(user.role)

      return name.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm)
    })
  }, [searchValue, users])

  function handleLogout() {
    clearSessionUser()
    navigate('/login', { replace: true })
  }

  function handleEditClick(user) {
    navigate(`/coordinador/usuarios/editar-usuario/${user.id}`)
  }

  async function handleDelete(user) {
    const confirmed = globalThis.confirm(`Eliminar a ${user.name}? Esta accion no se puede deshacer.`)
    if (!confirmed) return

    try {
      await deleteUser(user.id)
      setUsers((currentUsers) => currentUsers.filter((item) => item.id !== user.id))
      setMessage(`Usuario ${user.name} eliminado correctamente.`)
      setError('')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el usuario')
      setMessage('')
    }
  }



  return (
    <div className="coor-users-page">
      <DashboardNavbar links={NAV_LINKS} onLogout={handleLogout} activeIndex={3} />

      <main className="coor-users-main">
        <section className="coor-users-hero" style={{ position: 'relative' }}>
          <div>
            <p className="coor-users-eyebrow">Administracion</p>
            <h1>Usuarios del sistema</h1>
            <p>
              Busca, revisa y administra las cuentas registradas en la plataforma.
            </p>
          </div>
          <button
            type="button"
            className="coor-users-create-btn"
            style={{ position: 'absolute', right: 32, bottom: 32 }}
            onClick={() => navigate('/coordinador/usuarios/crear-usuario')}
          >
            Ir a crear usuario
          </button>
        </section>

        <section className="coor-users-card">
          <div className="coor-users-toolbar">
            <div>
              <h2>Lista de usuarios</h2>
              <p>Gestiona nombres, correos y roles desde este panel.</p>
            </div>

            <label className="coor-users-search">
              <span>Buscar</span>
              <input
                type="search"
                placeholder="Nombre, correo o rol"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </label>
          </div>

          {message ? <div className="coor-users-alert success">{message}</div> : null}
          {error ? <div className="coor-users-alert error">{error}</div> : null}

          <div className="coor-users-table-wrap">
            {loading ? (
              <div className="coor-users-empty">Cargando usuarios...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="coor-users-empty">No se encontraron usuarios con ese criterio.</div>
            ) : (
              <table className="coor-users-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="coor-users-name-cell">
                          <strong>{user.name}</strong>
                          <span>ID {user.id}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`coor-users-role ${normalizeText(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="coor-users-actions">
                          <button type="button" onClick={() => handleEditClick(user)}>
                            Editar
                          </button>
                          <button type="button" className="danger" onClick={() => handleDelete(user)}>
                            Eliminar
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

export default Usuario

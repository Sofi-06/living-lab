import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../../../components/navbar/DashboardNavbar'
import { clearSessionUser } from '../../../utils/session'
import { deleteUser, getUsers, updateUser } from '../../../services/users'
import './Usuario.css'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/coordinador' },
  { label: 'Proyectos', path: '/coordinador' },
  { label: 'Empresas', path: '/coordinador' },
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
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'DOCENTE' })
  const [saving, setSaving] = useState(false)

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

  function openEditModal(user) {
    setMessage('')
    setEditingUser(user)
    setEditForm({
      name: user.name ?? '',
      email: user.email ?? '',
      role: user.role ?? 'DOCENTE',
    })
  }

  function closeEditModal() {
    if (saving) return
    setEditingUser(null)
  }

  async function handleDelete(user) {
    const confirmed = globalThis.confirm(`Eliminar a ${user.name}? Esta accion no se puede deshacer.`)
    if (!confirmed) return

    try {
      await deleteUser(user.id)
      setUsers((currentUsers) => currentUsers.filter((item) => item.id !== user.id))
      setMessage(`Usuario ${user.name} eliminado correctamente.`)
      setError('')
      if (editingUser?.id === user.id) {
        setEditingUser(null)
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el usuario')
      setMessage('')
    }
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!editingUser) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = await updateUser(editingUser.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      })

      setUsers((currentUsers) =>
        currentUsers.map((item) => (item.id === payload.user.id ? payload.user : item)),
      )
      setEditingUser(null)
      setMessage(`Usuario ${payload.user.name} actualizado correctamente.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el usuario')
    } finally {
      setSaving(false)
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
                          <button type="button" onClick={() => openEditModal(user)}>
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

      {editingUser ? (
        <div className="coor-users-modal-backdrop" role="presentation" onClick={closeEditModal}>
          <div
            className="coor-users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coor-users-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="coor-users-modal-head">
              <div>
                <p className="coor-users-eyebrow">Editar usuario</p>
                <h3 id="coor-users-modal-title">{editingUser.name}</h3>
              </div>
              <button type="button" className="coor-users-close" onClick={closeEditModal}>
                Cerrar
              </button>
            </div>

            <form className="coor-users-form" onSubmit={handleSave}>
              <label>
                <span>Nombre</span>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>

              <label>
                <span>Correo</span>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>

              <label>
                <span>Rol</span>
                <select
                  value={editForm.role}
                  onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value }))}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="coor-users-form-actions">
                <button type="button" className="secondary" onClick={closeEditModal}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Usuario
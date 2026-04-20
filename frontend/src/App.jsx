import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/login/Login'
import CoordinadorDashboard from './pages/coordinador/CoordinadorDashboard'
import Usuario from './pages/coordinador/usuarios/Usuario'
import CrearUsuario from './pages/coordinador/usuarios/crear-usuario/CrearUsuario'
import DocenteDashboard from './pages/docente/DocenteDashboard'
import EvaluadorDashboard from './pages/evaluador/EvaluadorDashboard'
import { getSessionUser } from './utils/session'

const ROLE_PATHS = {
  COORDINADOR: '/coordinador',
  DOCENTE: '/docente',
  EVALUADOR: '/evaluador',
}

function normalizeRole(rawRole) {
  if (typeof rawRole !== 'string') return ''
  const normalized = rawRole.trim().toUpperCase()
  return ROLE_PATHS[normalized] ? normalized : ''
}

function roleToPath(rawRole) {
  const role = normalizeRole(rawRole)
  return role ? ROLE_PATHS[role] : '/login'
}

function getGuardedElement(requiredRole, element) {
  const sessionUser = getSessionUser()

  if (!sessionUser) {
    return <Navigate to="/login" replace />
  }

  const userRole = normalizeRole(sessionUser.role)

  if (!userRole) {
    return <Navigate to="/login" replace />
  }

  if (userRole !== requiredRole) {
    return <Navigate to={roleToPath(userRole)} replace />
  }

  return element
}

function CoordinadorRoute() {
  return getGuardedElement('COORDINADOR', <CoordinadorDashboard />)
}

function CoordinadorUsersRoute() {
  return getGuardedElement('COORDINADOR', <Usuario />)
}

function CoordinadorCreateUserRoute() {
  return getGuardedElement('COORDINADOR', <CrearUsuario />)
}

function DocenteRoute() {
  return getGuardedElement('DOCENTE', <DocenteDashboard />)
}

function EvaluadorRoute() {
  return getGuardedElement('EVALUADOR', <EvaluadorDashboard />)
}

function RootRedirect() {
  const sessionUser = getSessionUser()
  const destination = roleToPath(sessionUser?.role)

  if (!sessionUser || destination === '/login') {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={destination} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/coordinador"
          element={<CoordinadorRoute />}
        />

        <Route path="/coordinador/usuarios" element={<CoordinadorUsersRoute />} />
        <Route path="/coordinador/usuarios/crear-usuario" element={<CoordinadorCreateUserRoute />} />

        <Route path="/docente" element={<DocenteRoute />} />

        <Route
          path="/evaluador"
          element={<EvaluadorRoute />}
        />

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

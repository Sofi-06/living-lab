import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/login/Login'
import CoordinadorDashboard from './pages/coordinador/CoordinadorDashboard'
import Proyecto from './pages/coordinador/proyectos/Proyecto'
import CrearProyecto from './pages/coordinador/proyectos/crear-proyecto/CrearProyecto'
import DetalleProyecto from './pages/coordinador/proyectos/detalle-proyecto/DetalleProyecto'
import EditarProyecto from './pages/coordinador/proyectos/editar-proyecto/EditarProyecto'
import Empresa from './pages/coordinador/empresas/Empresa'
import CrearEmpresa from './pages/coordinador/empresas/crear-empresa/CrearEmpresa'
import EditarEmpresa from './pages/coordinador/empresas/editar-empresa/EditarEmpresa'
import Usuario from './pages/coordinador/usuarios/Usuario'
import CrearUsuario from './pages/coordinador/usuarios/crear-usuario/CrearUsuario'
import EditarUsuario from './pages/coordinador/usuarios/editar-usuario/EditarUsuario'
import DocenteDashboard from './pages/docente/DocenteDashboard'
import DocenteProyecto from './pages/docente/proyecto/DocenteProyecto'
import DetalleDocenteProyecto from './pages/docente/proyecto/detalle-proyecto/DetalleDocenteProyecto'
import EvaluadorDashboard from './pages/evaluador/EvaluadorDashboard'
import EvaluadorProyecto from './pages/evaluador/proyectos/EvaluadorProyecto'
import DetalleEvaluadorProyecto from './pages/evaluador/proyectos/detalle-proyecto/DetalleEvaluadorProyecto'
import { getSessionUser } from './utils/session'

const ROLE_PATHS = {
  COORDINADOR: '/coordinador',
  PARTICIPANTE: '/docente',
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

function CoordinadorProjectsRoute() {
  return getGuardedElement('COORDINADOR', <Proyecto />)
}

function CoordinadorCreateProjectRoute() {
  return getGuardedElement('COORDINADOR', <CrearProyecto />)
}

function CoordinadorEditProjectRoute() {
  return getGuardedElement('COORDINADOR', <EditarProyecto />)
}

function CoordinadorProjectDetailRoute() {
  return getGuardedElement('COORDINADOR', <DetalleProyecto />)
}

function CoordinadorCompaniesRoute() {
  return getGuardedElement('COORDINADOR', <Empresa />)
}

function CoordinadorCreateCompanyRoute() {
  return getGuardedElement('COORDINADOR', <CrearEmpresa />)
}

function CoordinadorEditCompanyRoute() {
  return getGuardedElement('COORDINADOR', <EditarEmpresa />)
}

function CoordinadorCreateUserRoute() {
  return getGuardedElement('COORDINADOR', <CrearUsuario />)
}

function CoordinadorEditUserRoute() {
  return getGuardedElement('COORDINADOR', <EditarUsuario />)
}

// function CoordinadorReportsRoute() {
//   return getGuardedElement('COORDINADOR', <Reportes />)
// }

function DocenteRoute() {
  return getGuardedElement('PARTICIPANTE', <DocenteDashboard />)
}

function DocenteProjectsRoute() {
  return getGuardedElement('PARTICIPANTE', <DocenteProyecto />)
}

function DocenteProjectDetailRoute() {
  return getGuardedElement('PARTICIPANTE', <DetalleDocenteProyecto />)
}

function EvaluadorRoute() {
  return getGuardedElement('EVALUADOR', <EvaluadorDashboard />)
}

function EvaluadorProjectsRoute() {
  return getGuardedElement('EVALUADOR', <EvaluadorProyecto />)
}

function EvaluadorProjectDetailRoute() {
  return getGuardedElement('EVALUADOR', <DetalleEvaluadorProyecto />)
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

        <Route path="/coordinador/proyectos" element={<CoordinadorProjectsRoute />} />
        <Route path="/coordinador/proyectos/crear-proyecto" element={<CoordinadorCreateProjectRoute />} />
        <Route path="/coordinador/proyectos/:id" element={<CoordinadorProjectDetailRoute />} />
        <Route path="/coordinador/proyectos/editar-proyecto/:id" element={<CoordinadorEditProjectRoute />} />
        <Route path="/coordinador/empresas" element={<CoordinadorCompaniesRoute />} />
        <Route path="/coordinador/empresas/crear-empresa" element={<CoordinadorCreateCompanyRoute />} />
        <Route path="/coordinador/empresas/editar-empresa/:id" element={<CoordinadorEditCompanyRoute />} />
        <Route path="/coordinador/usuarios" element={<CoordinadorUsersRoute />} />
        <Route path="/coordinador/usuarios/crear-usuario" element={<CoordinadorCreateUserRoute />} />
        <Route path="/coordinador/usuarios/editar-usuario/:id" element={<CoordinadorEditUserRoute />} />
        {/* <Route path="/coordinador/reportes" element={<CoordinadorReportsRoute />} /> */}

        <Route path="/docente" element={<DocenteRoute />} />
        <Route path="/docente/proyectos" element={<DocenteProjectsRoute />} />
        <Route path="/docente/proyectos/:id" element={<DocenteProjectDetailRoute />} />

        <Route
          path="/evaluador"
          element={<EvaluadorRoute />}
        />
        <Route path="/evaluador/proyectos" element={<EvaluadorProjectsRoute />} />
        <Route path="/evaluador/proyectos/:id" element={<EvaluadorProjectDetailRoute />} />

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
